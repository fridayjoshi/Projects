#!/usr/bin/env python3
"""
Health Data Analyzer - Parse and analyze Apple Health data

Usage:
    ./analyze.py --file health/latest.json
    ./analyze.py --file health/latest.json --report daily
    ./analyze.py --file health/latest.json --metric hrv --days 7
"""

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Any
import argparse


class HealthAnalyzer:
    """Parse and analyze Apple Health data from Health Auto Export"""
    
    def __init__(self, filepath: str):
        self.filepath = Path(filepath)
        self.data = None
        self.metrics = {}
        self.workouts = []
        self.load_data()
        
    def load_data(self):
        """Load health data from JSON file"""
        if not self.filepath.exists():
            raise FileNotFoundError(f"Health data file not found: {self.filepath}")
            
        with open(self.filepath, 'r') as f:
            self.data = json.load(f)
            
        # Parse metrics into dict by name
        for metric in self.data['data']['metrics']:
            name = metric['name']
            self.metrics[name] = {
                'units': metric['units'],
                'data': metric['data']
            }
            
        # Parse workouts
        self.workouts = self.data['data'].get('workouts', [])
        
    def get_metric_data(self, metric_name: str, days: int = 7) -> List[Dict]:
        """Get metric data for last N days"""
        if metric_name not in self.metrics:
            return []
            
        cutoff = datetime.now() - timedelta(days=days)
        data_points = []
        
        for point in self.metrics[metric_name]['data']:
            try:
                date = datetime.strptime(point['date'], '%Y-%m-%d %H:%M:%S %z')
                if date.replace(tzinfo=None) >= cutoff:
                    data_points.append({
                        'date': date,
                        'value': point['qty'],
                        'source': point.get('source', 'Unknown')
                    })
            except (ValueError, KeyError):
                continue
                
        return sorted(data_points, key=lambda x: x['date'])
    
    def daily_average(self, metric_name: str, days: int = 7) -> Dict[str, float]:
        """Calculate daily averages for a metric"""
        data = self.get_metric_data(metric_name, days)
        if not data:
            return {}
            
        by_day = defaultdict(list)
        for point in data:
            day = point['date'].date()
            by_day[day].append(point['value'])
            
        averages = {}
        for day, values in sorted(by_day.items()):
            averages[str(day)] = sum(values) / len(values)
            
        return averages
    
    def daily_total(self, metric_name: str, days: int = 7) -> Dict[str, float]:
        """Calculate daily totals for cumulative metrics (steps, energy, etc)"""
        data = self.get_metric_data(metric_name, days)
        if not data:
            return {}
            
        by_day = defaultdict(list)
        for point in data:
            day = point['date'].date()
            by_day[day].append(point['value'])
            
        totals = {}
        for day, values in sorted(by_day.items()):
            totals[str(day)] = sum(values)
            
        return totals
    
    def detect_red_flags(self) -> List[str]:
        """Detect health red flags based on criteria"""
        flags = []
        
        # Check resting HR elevated >10 bpm for 3+ days
        rhr_data = self.daily_average('resting_heart_rate', days=7)
        if len(rhr_data) >= 3:
            values = list(rhr_data.values())
            recent_avg = sum(values[-3:]) / 3
            baseline = sum(values) / len(values)
            if recent_avg > baseline + 10:
                flags.append(f"⚠️  Resting HR elevated: {recent_avg:.1f} bpm (baseline {baseline:.1f})")
        
        # Check HRV declining trend over 5+ days
        hrv_data = self.daily_average('heart_rate_variability', days=7)
        if len(hrv_data) >= 5:
            values = list(hrv_data.values())
            if len(values) >= 5:
                early_avg = sum(values[:3]) / 3
                recent_avg = sum(values[-3:]) / 3
                if recent_avg < early_avg * 0.85:  # 15% decline
                    flags.append(f"⚠️  HRV declining: {recent_avg:.1f} ms (was {early_avg:.1f})")
        
        # Check zero workouts in last 7 days
        if len(self.workouts) == 0:
            flags.append("⚠️  No workouts recorded in last 7 days")
        
        # Check step count <2000 for 3+ days
        steps_data = self.daily_total('step_count', days=7)
        if len(steps_data) >= 3:
            values = list(steps_data.values())
            low_days = sum(1 for v in values[-7:] if v < 2000)
            if low_days >= 3:
                flags.append(f"⚠️  Low activity: {low_days} days with <2000 steps")
        
        # Check sleep analysis (need to calculate total sleep per day)
        # Sleep data is more complex - skip for now
        
        return flags
    
    def generate_report(self, report_type: str = 'summary') -> str:
        """Generate health report"""
        report = []
        report.append("=" * 60)
        report.append("HEALTH DATA ANALYSIS")
        report.append(f"Report generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"Data file: {self.filepath}")
        report.append("=" * 60)
        report.append("")
        
        # Key metrics (last 7 days)
        report.append("KEY METRICS (7-day averages):")
        report.append("-" * 60)
        
        # Metrics that should be averaged
        avg_metrics = [
            ('resting_heart_rate', 'Resting HR', 'bpm'),
            ('heart_rate_variability', 'HRV', 'ms'),
        ]
        
        for metric_name, label, unit in avg_metrics:
            averages = self.daily_average(metric_name, days=7)
            if averages:
                recent_avg = sum(averages.values()) / len(averages)
                report.append(f"  {label:20s}: {recent_avg:8.1f} {unit}")
            else:
                report.append(f"  {label:20s}: No data")
        
        # Metrics that should be summed daily, then averaged
        total_metrics = [
            ('step_count', 'Steps/day', 'count'),
            ('active_energy', 'Active Energy/day', 'kcal'),
            ('apple_exercise_time', 'Exercise Time/day', 'min'),
        ]
        
        for metric_name, label, unit in total_metrics:
            totals = self.daily_total(metric_name, days=7)
            if totals:
                daily_avg = sum(totals.values()) / len(totals)
                report.append(f"  {label:20s}: {daily_avg:8.1f} {unit}")
            else:
                report.append(f"  {label:20s}: No data")
        
        report.append("")
        
        # Workouts
        report.append(f"WORKOUTS: {len(self.workouts)} recorded")
        report.append("-" * 60)
        
        if self.workouts:
            for i, workout in enumerate(self.workouts[:5], 1):
                start = workout.get('start', 'Unknown')
                report.append(f"  {i}. {start}")
                
        report.append("")
        
        # Red flags
        flags = self.detect_red_flags()
        report.append(f"RED FLAGS: {len(flags)} detected")
        report.append("-" * 60)
        
        if flags:
            for flag in flags:
                report.append(f"  {flag}")
        else:
            report.append("  ✅ No red flags detected")
        
        report.append("")
        report.append("=" * 60)
        
        return "\n".join(report)


def main():
    parser = argparse.ArgumentParser(description='Analyze Apple Health data')
    parser.add_argument('--file', required=True, help='Path to health JSON file')
    parser.add_argument('--report', default='summary', choices=['summary', 'daily', 'detailed'],
                        help='Report type')
    parser.add_argument('--metric', help='Show specific metric data')
    parser.add_argument('--days', type=int, default=7, help='Number of days to analyze')
    
    args = parser.parse_args()
    
    try:
        analyzer = HealthAnalyzer(args.file)
        
        if args.metric:
            # Show specific metric
            # Use totals for cumulative metrics, averages for rates
            cumulative_metrics = ['step_count', 'active_energy', 'apple_exercise_time', 
                                   'walking_running_distance', 'flights_climbed']
            
            if args.metric in cumulative_metrics:
                data = analyzer.daily_total(args.metric, days=args.days)
                print(f"\n{args.metric.upper()} - Daily Totals ({args.days} days)")
            else:
                data = analyzer.daily_average(args.metric, days=args.days)
                print(f"\n{args.metric.upper()} - Daily Averages ({args.days} days)")
            
            print("=" * 60)
            for day, value in data.items():
                print(f"  {day}: {value:.2f}")
        else:
            # Show general report
            print(analyzer.generate_report(args.report))
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
