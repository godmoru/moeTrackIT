import React from '../../_node_modules/@types/react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ProgressRingProps {
  value: number;
  max: number;
  label: string;
  color?: 'green' | 'blue' | 'purple' | 'orange';
  size?: number;
}

const colorMap = {
  green: { ring: '#10b981', bg: '#d1fae5' },
  blue: { ring: '#3b82f6', bg: '#dbeafe' },
  purple: { ring: '#8b5cf6', bg: '#ede9fe' },
  orange: { ring: '#f59e0b', bg: '#fef3c7' },
};

export function ProgressRing({
  value,
  max,
  label,
  color = 'green',
  size = 80,
}: ProgressRingProps) {
  const percent = Math.min((value / max) * 100, 100);
  const { ring, bg } = colorMap[color];
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={bg}
            strokeWidth={strokeWidth}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ring}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </Svg>
        <View style={[styles.centerContent, { width: size, height: size }]}>
          <Text style={styles.percentText}>{percent.toFixed(0)}%</Text>
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  label: {
    marginTop: 8,
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
});
