import React from 'react';
import { View, Platform } from 'react-native';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: any;
}

// Universal Cross-Platform SVG Renderer
const renderSvg = (
  content: string,
  size: number = 20,
  color: string = '#f4f4f5',
  strokeWidth: number = 2,
  fill: string = 'none',
  viewBox: string = '0 0 24 24',
  style?: any
) => {
  if (Platform.OS === 'web') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          color,
          verticalAlign: 'middle',
          flexShrink: 0,
          ...style,
        }}
        dangerouslySetInnerHTML={{
          __html: `<svg width="${size}" height="${size}" viewBox="${viewBox}" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" style="width:${size}px;height:${size}px;display:block;">${content}</svg>`,
        }}
      />
    );
  }

  // Native React Native fallback
  return <View style={[{ width: size, height: size }, style]} />;
};

// 1. Official OAuth Brand Logos (Zero Raw Emojis)
export const GoogleIcon = ({ size = 20 }: { size?: number }) => {
  if (Platform.OS === 'web') {
    return (
      <span
        style={{ display: 'inline-flex', width: size, height: size, flexShrink: 0 }}
        dangerouslySetInnerHTML={{
          __html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="width:${size}px;height:${size}px;display:block;"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>`,
        }}
      />
    );
  }
  return <View style={{ width: size, height: size }} />;
};

export const MicrosoftIcon = ({ size = 20 }: { size?: number }) => {
  if (Platform.OS === 'web') {
    return (
      <span
        style={{ display: 'inline-flex', width: size, height: size, flexShrink: 0 }}
        dangerouslySetInnerHTML={{
          __html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="width:${size}px;height:${size}px;display:block;"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M13 1h10v10H13z"/><path fill="#00A4EF" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>`,
        }}
      />
    );
  }
  return <View style={{ width: size, height: size }} />;
};

// 2. Professional Enterprise Lucide Vector Icons (Strictly No Emojis, No Gimmick Magic Stars)
export const BriefcaseIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const TargetIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const LayersIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const FileTextIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const TrendingUpIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const MailIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const SendIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const CheckCircleIcon = ({ size = 20, color = '#10b981', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const ClockIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const SearchIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const PlusIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<path d="M5 12h14"/><path d="M12 5v14"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const FilterIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const SettingsIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const DollarSignIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const MicIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const BotIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const TrashIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const RefreshIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const DownloadIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const UploadIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="15" y2="3"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const EyeIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const ChevronRightIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<path d="m9 18 6-6-6-6"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const XIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const CompassIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const SlidersIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/><line x1="17" x2="23" y1="16" y2="16"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const LockIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const ArrowRightIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const AwardIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const UserIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const PhoneIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const CheckIcon = ({ size = 20, color = '#10b981', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<polyline points="20 6 9 17 4 12"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const CopyIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);

export const ZapIcon = ({ size = 20, color = '#f4f4f5', strokeWidth = 2, style }: IconProps) =>
  renderSvg('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>', size, color, strokeWidth, 'none', '0 0 24 24', style);
