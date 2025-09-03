import type { IconProps } from 'lucide-svelte';

export type UISize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const ICON_PROPS: Record<UISize, IconProps> = {
	/** very small icon (e.g. next to helper text) */
	xs: {
		size: 12,
		strokeWidth: 2
	},
	/** small icon, commonly used with body text */
	sm: {
		size: 16,
		strokeWidth: 2
	},
	/** medium icon, good for buttons and navigation */
	md: {
		size: 20,
		strokeWidth: 2
	},
	/** large icon, suitable for emphasized buttons or card titles */
	lg: {
		size: 24,
		strokeWidth: 2
	},
	/** extra large icon, for headers or hero sections */
	xl: {
		size: 28,
		strokeWidth: 2
	}
} as const;

export const getIconProps = (size: UISize) => ICON_PROPS[size];
export const getTextSizeClass = (size: UISize) => {
	switch (size) {
		case 'xs':
			return 'text-xs';
		case 'sm':
			return 'text-sm';
		case 'md':
			return 'text-md';
		case 'lg':
			return 'text-lg';
		case 'xl':
			return 'text-xl';
	}
};
