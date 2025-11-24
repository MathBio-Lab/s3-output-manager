'use client';

import { useState, useEffect } from 'react';
import { FaPalette } from 'react-icons/fa';

export function ThemeColorPicker() {
    const [color, setColor] = useState('#3b82f6'); // Default blue

    useEffect(() => {
        // Load saved color from localStorage
        const savedColor = localStorage.getItem('theme-color');
        if (savedColor) {
            setColor(savedColor);
            applyColor(savedColor);
        }
    }, []);

    const applyColor = (hexColor: string) => {
        const hsl = hexToHSL(hexColor);
        const root = document.documentElement;

        // Generate palette based on the selected color
        // Primary color (the selected color)
        root.style.setProperty('--theme-primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
        root.style.setProperty('--theme-primary-foreground', `${hsl.h} ${hsl.s}% ${hsl.l > 50 ? 10 : 95}%`);

        // Background colors (very light/dark versions)
        const bgLightness = hsl.l > 50 ? 98 : 8;
        const bgSaturation = Math.min(hsl.s, 15);
        root.style.setProperty('--theme-background', `${hsl.h} ${bgSaturation}% ${bgLightness}%`);

        // Card/surface colors (slightly different from background)
        const cardLightness = hsl.l > 50 ? 100 : 12;
        root.style.setProperty('--theme-card', `${hsl.h} ${bgSaturation}% ${cardLightness}%`);

        // Accent colors (lighter/darker version of primary)
        const accentLightness = hsl.l > 50 ? Math.max(hsl.l - 10, 85) : Math.min(hsl.l + 10, 25);
        root.style.setProperty('--theme-accent', `${hsl.h} ${Math.min(hsl.s, 30)}% ${accentLightness}%`);

        // Border colors
        const borderLightness = hsl.l > 50 ? 90 : 20;
        root.style.setProperty('--theme-border', `${hsl.h} ${Math.min(hsl.s, 20)}% ${borderLightness}%`);

        // Muted colors
        const mutedLightness = hsl.l > 50 ? 95 : 15;
        root.style.setProperty('--theme-muted', `${hsl.h} ${Math.min(hsl.s, 20)}% ${mutedLightness}%`);

        // Foreground color (text)
        const fgLightness = hsl.l > 50 ? 10 : 95;
        root.style.setProperty('--theme-foreground', `${hsl.h} ${Math.min(hsl.s, 10)}% ${fgLightness}%`);
    };

    const hexToHSL = (hex: string) => {
        // Remove # if present
        hex = hex.replace('#', '');

        // Convert to RGB
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setColor(newColor);
        applyColor(newColor);
        localStorage.setItem('theme-color', newColor);
    };

    return (
        <div className="relative group">
            <label
                htmlFor="theme-color-picker"
                className="flex items-center justify-center h-9 w-9 rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                title="Choose theme color"
            >
                <FaPalette className="h-4 w-4" />
            </label>
            <input
                id="theme-color-picker"
                type="color"
                value={color}
                onChange={handleColorChange}
                className="absolute opacity-0 w-0 h-0"
            />
        </div>
    );
}
