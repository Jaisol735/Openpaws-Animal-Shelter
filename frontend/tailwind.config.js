export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4CAF50', // green - adoption ready / safe
        secondary: '#2196F3', // blue - main actions
        warning: '#FF9800', // orange - monitoring
        danger: '#F44336', // red - emergency
        success: '#4CAF50',
        bg: '#F7FAF9',
        card: '#FFFFFF',
        'text-main': '#1F2937',
        'text-secondary': '#6B7280',
        'risk-low': '#dcfce7',
        'risk-low-text': '#166534',
        'risk-medium': '#ffedd5',
        'risk-medium-text': '#9a3412',
        'risk-high': '#fee2e2',
        'risk-high-text': '#b91c1c',
      },
    },
  },
  plugins: [],
}
