from flask import request, make_response, jsonify
from flask_jwt_extended import get_jwt_identity
from models.project_model import ProjectModel
from models.task_model import TaskModel
from models.report_model import ReportModel
import logging
from datetime import datetime, timedelta
from bson import ObjectId
import json
import traceback

logger = logging.getLogger(__name__)

class WeeklyReportController:
    """Weekly Status Report Controller - Dynamic & Customizable"""
    
    @staticmethod
    def generate_weekly_report(project_id):
        """Generate a dynamic weekly status report"""
        try:
            user_id = get_jwt_identity()
            data = request.get_json() or {}
            
            logger.info(f"Generating weekly report for project {project_id}")
            logger.info(f"Request data: {data}")
            
            project = ProjectModel.find_by_id(project_id)
            if not project:
                return {'error': 'Project not found'}, 404
            
            if project.get('owner_id') != user_id and user_id not in project.get('members', []):
                return {'error': 'Access denied'}, 403
            
            tasks = TaskModel.find_by_project(project_id) or []
            members = ProjectModel.get_members(project_id) or []
            
            logger.info(f"Found {len(tasks)} tasks and {len(members)} members")
            
            report_data = WeeklyReportController._build_dynamic_weekly_report(
                project, tasks, members, data
            )
            
            report = {
                'project_id': project_id,
                'project_name': project.get('name', 'Unknown'),
                'generated_by': user_id,
                'generated_by_name': data.get('generated_by_name', 'Unknown'),
                'report_type': 'weekly_status',
                'data': report_data,
                'format': data.get('format', 'pdf'),
                'status': 'completed',
                'generated_at': datetime.utcnow().isoformat(),
                'reporting_period': data.get('reporting_period', {})
            }
            
            report_id = ReportModel.create(report)
            
            if not report_id:
                return {'error': 'Failed to save report'}, 500
            
            saved_report = ReportModel.find_by_id(report_id)
            
            if data.get('format') == 'pdf':
                try:
                    return WeeklyReportController._export_weekly_pdf(
                        report_data, project, report, members
                    )
                except Exception as e:
                    logger.error(f"PDF generation failed: {str(e)}")
                    logger.error(traceback.format_exc())
                    return {
                        'message': 'Report generated but PDF export failed. Please try JSON format.',
                        'report_id': report_id,
                        'report': ReportModel.to_dict(saved_report) if saved_report else None
                    }, 200
            
            return {
                'message': 'Weekly report generated successfully',
                'report_id': report_id,
                'report': ReportModel.to_dict(saved_report) if saved_report else None
            }, 200
            
        except Exception as e:
            logger.error(f"Error generating weekly report: {str(e)}")
            logger.error(traceback.format_exc())
            return {'error': f'Failed to generate weekly report: {str(e)}'}, 500
    
    @staticmethod
    def _build_dynamic_weekly_report(project, tasks, members, params):
        """Build dynamic weekly report data based on project data"""
        try:
            now = datetime.utcnow()
            week_start = now - timedelta(days=7)
            
            recent_tasks = []
            for t in tasks:
                updated = t.get('updated_at')
                if updated:
                    if isinstance(updated, str):
                        try:
                            updated = datetime.fromisoformat(updated.replace('Z', '+00:00'))
                        except:
                            pass
                    if updated and updated > week_start:
                        recent_tasks.append(t)
            
            total_tasks = len(tasks)
            completed = len([t for t in tasks if t.get('status') == 'Done'])
            in_progress = len([t for t in tasks if t.get('status') == 'In Progress'])
            review = len([t for t in tasks if t.get('status') == 'Review'])
            todo = len([t for t in tasks if t.get('status') == 'Todo'])
            
            completed_this_week = len([t for t in recent_tasks if t.get('status') == 'Done'])
            in_progress_this_week = len([t for t in recent_tasks if t.get('status') == 'In Progress'])
            created_this_week = len([t for t in recent_tasks if t.get('created_at')])
            
            member_map = {m.get('_id'): m for m in members}
            
            action_log = []
            for task in tasks[:15]:
                assigned_to_id = task.get('assigned_to', '')
                owner = member_map.get(assigned_to_id, {}).get('name', task.get('assigned_to_name', 'Unassigned'))
                status = task.get('status', 'Todo')
                status_display = 'Open' if status != 'Done' else 'Completed'
                
                action_log.append({
                    'id': str(task.get('_id', '')),
                    'action': task.get('title', ''),
                    'owner': owner or 'Unassigned',
                    'due_date': task.get('due_date', ''),
                    'status': status_display,
                    'notes': (task.get('description', '') or '')[:100]
                })
            
            completion_rate = (completed / max(total_tasks, 1)) * 100
            risks = []
            
            if total_tasks > 0:
                if completion_rate < 30:
                    risks.append({
                        'type': 'Progress',
                        'item': 'Low completion rate',
                        'description': f'Only {completed} of {total_tasks} tasks completed ({completion_rate:.1f}%)',
                        'impact': 'Project may be significantly delayed',
                        'mitigation': 'Review priorities and allocate additional resources'
                    })
                elif completion_rate < 60:
                    risks.append({
                        'type': 'Progress',
                        'item': 'Moderate completion rate',
                        'description': f'{completed} of {total_tasks} tasks completed ({completion_rate:.1f}%)',
                        'impact': 'Project may experience minor delays',
                        'mitigation': 'Monitor progress closely and adjust schedule'
                    })
                
                if todo > total_tasks * 0.4:
                    risks.append({
                        'type': 'Backlog',
                        'item': 'Large backlog',
                        'description': f'{todo} tasks in backlog ({(todo/total_tasks*100):.1f}%)',
                        'impact': 'Workload may become unmanageable',
                        'mitigation': 'Prioritize tasks and break down large items'
                    })
                
                if review > total_tasks * 0.2:
                    risks.append({
                        'type': 'Quality',
                        'item': 'Review bottleneck',
                        'description': f'{review} tasks pending review',
                        'impact': 'Quality assurance may slow down progress',
                        'mitigation': 'Streamline review process and allocate more reviewers'
                    })
            
            if members:
                avg_tasks = total_tasks / len(members) if members else 0
                for member in members:
                    member_tasks = [t for t in tasks if t.get('assigned_to') == member.get('_id')]
                    if len(member_tasks) > avg_tasks * 1.5 and avg_tasks > 0:
                        risks.append({
                            'type': 'Resources',
                            'item': 'Uneven workload',
                            'description': f'{member.get("name", "Unknown")} has {len(member_tasks)} tasks (avg: {avg_tasks:.1f})',
                            'impact': 'Team member may be overburdened',
                            'mitigation': 'Redistribute tasks or provide additional support'
                        })
                        break
            
            next_steps = []
            high_priority_tasks = [t for t in tasks if t.get('priority') == 'High' and t.get('status') != 'Done']
            if high_priority_tasks:
                next_steps.append({
                    'owner': 'Team',
                    'step': f'Complete {len(high_priority_tasks)} high-priority tasks'
                })
            
            if in_progress > 0:
                next_steps.append({
                    'owner': 'Team',
                    'step': f'Move {in_progress} in-progress tasks to review'
                })
            
            if review > 0:
                next_steps.append({
                    'owner': 'Project Manager',
                    'step': f'Review and approve {review} pending tasks'
                })
            
            if todo > 0:
                next_steps.append({
                    'owner': 'Team Lead',
                    'step': f'Prioritize and assign {todo} backlog tasks'
                })
            
            for member in members:
                member_tasks = [t for t in tasks if t.get('assigned_to') == member.get('_id') and t.get('status') != 'Done']
                if len(member_tasks) > 0:
                    next_steps.append({
                        'owner': member.get('name', 'Unknown'),
                        'step': f'Complete {len(member_tasks)} assigned tasks'
                    })
                    if len(next_steps) >= 8:
                        break
            
            team_members = []
            for m in members:
                team_members.append({
                    'name': m.get('name', 'Unknown'),
                    'role': m.get('role', 'Team Member'),
                    'email': m.get('email', ''),
                    'department': m.get('department', ''),
                    'is_external': m.get('is_external', False)
                })
            
            return {
                'project_name': project.get('name', ''),
                'project_description': project.get('description', ''),
                'project_status': project.get('status', 'Planning'),
                'project_priority': project.get('priority', 'Medium'),
                'reporting_date': now.strftime('%d %B %Y'),
                'reporting_week': f"Week {now.isocalendar()[1]}, {now.year}",
                'prepared_by': params.get('prepared_by', 'Project Team'),
                'executive_summary': {
                    'total_tasks': total_tasks,
                    'completed': completed,
                    'in_progress': in_progress,
                    'review': review,
                    'todo': todo,
                    'completion_rate': round(completion_rate, 1),
                    'completed_this_week': completed_this_week,
                    'in_progress_this_week': in_progress_this_week,
                    'created_this_week': created_this_week,
                    'overall_status': 'On Track' if completion_rate >= 80 else 
                                    'Progressing' if completion_rate >= 50 else 
                                    'Behind Schedule' if completion_rate >= 20 else 'At Risk'
                },
                'action_log': action_log,
                'planning_status': {
                    'current_position': f'Project is {round(completion_rate, 1)}% complete with {total_tasks} tasks',
                    'next_update': f'Next weekly update will include progress on {len([t for t in tasks if t.get("status") != "Done"])} remaining tasks'
                },
                'risks': risks,
                'next_steps': next_steps,
                'team_members': team_members,
                'member_stats': WeeklyReportController._calculate_member_stats(tasks, members),
                'label_breakdown': WeeklyReportController._get_label_breakdown(tasks),
                'priority_breakdown': {
                    'high': len([t for t in tasks if t.get('priority') == 'High']),
                    'medium': len([t for t in tasks if t.get('priority') == 'Medium']),
                    'low': len([t for t in tasks if t.get('priority') == 'Low'])
                }
            }
            
        except Exception as e:
            logger.error(f"Error building weekly report: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                'project_name': project.get('name', ''),
                'reporting_date': datetime.utcnow().strftime('%d %B %Y'),
                'executive_summary': {'error': str(e)},
                'action_log': [],
                'risks': [],
                'next_steps': [],
                'team_members': []
            }
    
    @staticmethod
    def _calculate_member_stats(tasks, members):
        """Calculate member statistics"""
        stats = []
        for member in members:
            member_id = member.get('_id')
            member_tasks = [t for t in tasks if t.get('assigned_to') == member_id]
            completed = len([t for t in member_tasks if t.get('status') == 'Done'])
            in_progress = len([t for t in member_tasks if t.get('status') == 'In Progress'])
            
            stats.append({
                'name': member.get('name', 'Unknown'),
                'role': member.get('role', 'Team Member'),
                'total_tasks': len(member_tasks),
                'completed': completed,
                'in_progress': in_progress,
                'completion_rate': round((completed / len(member_tasks) * 100) if member_tasks else 0, 1)
            })
        return stats
    
    @staticmethod
    def _get_label_breakdown(tasks):
        """Get label breakdown - handles dict labels properly"""
        label_counts = {}
        for task in tasks:
            labels = task.get('labels', [])
            if isinstance(labels, str):
                try:
                    labels = json.loads(labels)
                except:
                    labels = []
            if not isinstance(labels, list):
                labels = []
            
            for label in labels:
                if label:
                    if isinstance(label, dict):
                        label_key = label.get('name', str(label))
                    else:
                        label_key = str(label)
                    if label_key:
                        label_counts[label_key] = label_counts.get(label_key, 0) + 1
        return label_counts
    
    @staticmethod
    def _export_weekly_pdf(report_data, project, report, members):
        """Export weekly report as PDF - Fixed version"""
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.lib import colors
            from reportlab.lib.enums import TA_CENTER, TA_LEFT
            from io import BytesIO
            
            logger.info("Generating PDF report...")
            
            buffer = BytesIO()
            doc = SimpleDocTemplate(
                buffer, 
                pagesize=A4,
                rightMargin=50, 
                leftMargin=50, 
                topMargin=72, 
                bottomMargin=72
            )
            
            styles = getSampleStyleSheet()
            story = []
            
            # Custom styles
            main_title_style = ParagraphStyle(
                'MainTitle',
                parent=styles['Heading1'],
                fontSize=22,
                textColor=colors.HexColor('#1B4F72'),
                alignment=TA_CENTER,
                spaceAfter=10,
                fontName='Helvetica-Bold'
            )
            
            subtitle_style = ParagraphStyle(
                'Subtitle',
                parent=styles['Heading2'],
                fontSize=14,
                textColor=colors.HexColor('#2E4053'),
                alignment=TA_CENTER,
                spaceAfter=6,
                fontName='Helvetica'
            )
            
            section_title_style = ParagraphStyle(
                'SectionTitle',
                parent=styles['Heading2'],
                fontSize=14,
                textColor=colors.HexColor('#1B4F72'),
                spaceAfter=10,
                spaceBefore=15,
                fontName='Helvetica-Bold'
            )
            
            normal_style = ParagraphStyle(
                'Normal',
                parent=styles['Normal'],
                fontSize=10,
                textColor=colors.HexColor('#2C3E50'),
                leading=14,
                fontName='Helvetica'
            )
            
            bold_style = ParagraphStyle(
                'Bold',
                parent=styles['Normal'],
                fontSize=10,
                textColor=colors.HexColor('#2C3E50'),
                leading=14,
                fontName='Helvetica-Bold'
            )
            
            # Cover Page
            story.append(Paragraph(f'{report_data.get("project_name", "Project")}', main_title_style))
            story.append(Spacer(1, 5))
            story.append(Paragraph('Weekly Status Report', subtitle_style))
            story.append(Spacer(1, 10))
            
            status = report_data.get('project_status', 'Planning')
            story.append(Paragraph(f'Project Status: {status}', normal_style))
            story.append(Paragraph(f'Reporting date: {report_data.get("reporting_date", datetime.utcnow().strftime("%d %B %Y"))}', normal_style))
            story.append(Paragraph(f'Reporting week: {report_data.get("reporting_week", "")}', normal_style))
            story.append(Spacer(1, 5))
            
            prepared_by = report_data.get('prepared_by', 'Project Team')
            story.append(Paragraph(f'Prepared by: {prepared_by}', normal_style))
            story.append(Spacer(1, 15))
            
            # Project Teams
            team_members = report_data.get('team_members', [])
            if team_members:
                story.append(Paragraph('Project Teams', section_title_style))
                
                team_table_data = [['Team Member', 'Role']]
                for member in team_members:
                    team_table_data.append([
                        member.get('name', 'Unknown'),
                        member.get('role', 'Team Member')
                    ])
                
                team_table = Table(team_table_data, colWidths=[3*inch, 3*inch])
                team_table.setStyle(TableStyle([
                    ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
                    ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#D6EAF8')),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDC3C7')),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('WORDWRAP', (0, 0), (-1, -1), True),
                ]))
                story.append(team_table)
            
            story.append(PageBreak())
            
            # Executive Summary
            story.append(Paragraph('01 Executive Summary', section_title_style))
            story.append(Spacer(1, 5))
            
            summary = report_data.get('executive_summary', {})
            if summary:
                stats_data = [
                    ['Metric', 'Value', ''],
                    ['Total Tasks', str(summary.get('total_tasks', 0)), ''],
                    ['Completed', str(summary.get('completed', 0)), f"{summary.get('completion_rate', 0)}%"],
                    ['In Progress', str(summary.get('in_progress', 0)), ''],
                    ['Review', str(summary.get('review', 0)), ''],
                    ['Todo', str(summary.get('todo', 0)), ''],
                ]
                
                stats_table = Table(stats_data, colWidths=[2*inch, 1.5*inch, 1.5*inch])
                stats_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1B4F72')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDC3C7')),
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('WORDWRAP', (0, 0), (-1, -1), True),
                ]))
                story.append(stats_table)
                story.append(Spacer(1, 10))
                
                overall_status = summary.get('overall_status', 'Unknown')
                story.append(Paragraph(f'Overall Status: {overall_status}', bold_style))
                story.append(Spacer(1, 5))
                story.append(Paragraph('Weekly Progress:', bold_style))
                story.append(Paragraph(f'  - Tasks completed this week: {summary.get("completed_this_week", 0)}', normal_style))
                story.append(Paragraph(f'  - Tasks in progress this week: {summary.get("in_progress_this_week", 0)}', normal_style))
            
            story.append(PageBreak())
            
            # Action Log
            story.append(Paragraph('02 Action Log', section_title_style))
            story.append(Spacer(1, 5))
            
            action_log = report_data.get('action_log', [])
            if action_log:
                action_data = [['Action', 'Owner', 'Due', 'Status', 'Notes']]
                for action in action_log[:12]:
                    action_data.append([
                        (action.get('action', '') or '')[:30],
                        (action.get('owner', '') or ''),
                        (action.get('due_date', '') or ''),
                        (action.get('status', '') or ''),
                        (action.get('notes', '') or '')[:30]
                    ])
                
                action_table = Table(action_data, colWidths=[2.0*inch, 1.0*inch, 0.8*inch, 0.8*inch, 1.6*inch])
                action_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1B4F72')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 8),
                    ('FONTSIZE', (0, 1), (-1, -1), 7),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDC3C7')),
                    ('TOPPADDING', (0, 0), (-1, -1), 5),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('WORDWRAP', (0, 0), (-1, -1), True),
                ]))
                story.append(action_table)
            else:
                story.append(Paragraph('No action items found.', normal_style))
            
            story.append(PageBreak())
            
            # Planning Status
            story.append(Paragraph('03 Planning Status', section_title_style))
            story.append(Spacer(1, 5))
            
            planning = report_data.get('planning_status', {})
            story.append(Paragraph('Current planning position:', bold_style))
            story.append(Paragraph(planning.get('current_position', 'Project is in progress'), normal_style))
            story.append(Spacer(1, 10))
            
            priority = report_data.get('priority_breakdown', {})
            if priority:
                story.append(Paragraph('Priority Breakdown:', bold_style))
                story.append(Paragraph(f'  - High Priority: {priority.get("high", 0)} tasks', normal_style))
                story.append(Paragraph(f'  - Medium Priority: {priority.get("medium", 0)} tasks', normal_style))
                story.append(Paragraph(f'  - Low Priority: {priority.get("low", 0)} tasks', normal_style))
            
            story.append(Spacer(1, 10))
            story.append(Paragraph('Next weekly update should add:', bold_style))
            story.append(Paragraph(planning.get('next_update', 'Progress updates on action items'), normal_style))
            
            story.append(PageBreak())
            
            # Risks & Dependencies
            story.append(Paragraph('04 Risks & Dependencies', section_title_style))
            story.append(Spacer(1, 5))
            
            risks = report_data.get('risks', [])
            if risks:
                risk_data = [['Type', 'Item', 'Description', 'Impact', 'Mitigation']]
                for risk in risks:
                    risk_data.append([
                        (risk.get('type', '') or ''),
                        (risk.get('item', '') or ''),
                        (risk.get('description', '') or ''),
                        (risk.get('impact', '') or ''),
                        (risk.get('mitigation', '') or '')
                    ])
                
                risk_table = Table(risk_data, colWidths=[0.8*inch, 0.9*inch, 2.0*inch, 1.8*inch, 1.7*inch])
                risk_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1B4F72')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 8),
                    ('FONTSIZE', (0, 1), (-1, -1), 7),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDC3C7')),
                    ('TOPPADDING', (0, 0), (-1, -1), 5),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('WORDWRAP', (0, 0), (-1, -1), True),
                ]))
                story.append(risk_table)
            else:
                story.append(Paragraph('No significant risks identified.', normal_style))
            
            story.append(PageBreak())
            
            # Next Steps
            story.append(Paragraph('05 Next Steps & Asks', section_title_style))
            story.append(Spacer(1, 5))
            
            next_steps = report_data.get('next_steps', [])
            if next_steps:
                steps_data = [['Owner', 'Next Steps']]
                for step in next_steps:
                    steps_data.append([
                        (step.get('owner', '') or ''),
                        (step.get('step', '') or '')
                    ])
                
                steps_table = Table(steps_data, colWidths=[1.8*inch, 5.2*inch])
                steps_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1B4F72')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDC3C7')),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('WORDWRAP', (0, 0), (-1, -1), True),
                ]))
                story.append(steps_table)
            else:
                story.append(Paragraph('No pending next steps.', normal_style))
            
            story.append(PageBreak())
            
            # Team Performance
            member_stats = report_data.get('member_stats', [])
            if member_stats:
                story.append(Paragraph('06 Team Performance', section_title_style))
                story.append(Spacer(1, 5))
                
                stats_data = [['Name', 'Role', 'Tasks', 'Completed', 'In Progress', 'Rate']]
                for stat in member_stats:
                    stats_data.append([
                        (stat.get('name', '') or ''),
                        (stat.get('role', '') or ''),
                        str(stat.get('total_tasks', 0) or 0),
                        str(stat.get('completed', 0) or 0),
                        str(stat.get('in_progress', 0) or 0),
                        f"{stat.get('completion_rate', 0) or 0}%"
                    ])
                
                stats_table = Table(stats_data, colWidths=[1.4*inch, 1.2*inch, 0.7*inch, 0.7*inch, 0.7*inch, 0.8*inch])
                stats_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1B4F72')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 8),
                    ('FONTSIZE', (0, 1), (-1, -1), 7),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDC3C7')),
                    ('TOPPADDING', (0, 0), (-1, -1), 5),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('WORDWRAP', (0, 0), (-1, -1), True),
                ]))
                story.append(stats_table)
            
            # Footer
            story.append(Spacer(1, 30))
            footer_style = ParagraphStyle(
                'Footer',
                parent=styles['Normal'],
                fontSize=8,
                textColor=colors.HexColor('#95A5A6'),
                alignment=TA_CENTER
            )
            story.append(Paragraph(f'Generated on {datetime.utcnow().strftime("%d %B %Y, %H:%M")}', footer_style))
            story.append(Paragraph(f'Report ID: {report.get("_id", "")}', footer_style))
            
            doc.build(story)
            buffer.seek(0)
            
            logger.info("PDF report generated successfully")
            
            response = make_response(buffer.getvalue())
            response.headers['Content-Disposition'] = f'attachment; filename=weekly_status_report_{report_data.get("project_name", "project")}_{datetime.utcnow().strftime("%d%b%Y")}.pdf'
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Expose-Headers'] = 'Content-Disposition'
            return response
            
        except ImportError as e:
            logger.error(f"reportlab not installed: {str(e)}")
            return {'error': 'PDF generation failed. reportlab not installed. Please run: pip install reportlab'}, 500
        except Exception as e:
            logger.error(f"Error exporting weekly report: {str(e)}")
            logger.error(traceback.format_exc())
            return {'error': f'Failed to export weekly report: {str(e)}'}, 500







