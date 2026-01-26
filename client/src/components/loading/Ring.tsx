import { Ring } from 'ldrs/react'
import 'ldrs/react/Ring.css'

interface Props {
    size?: number;
    speed?: number;
    bgOpacity?: number;
    color?: 'primary' | 'white';
}

export default function RingLoading({ color = 'primary', size = 30, speed = 1.5, bgOpacity = 0.25 }: Props) {
    
    const colorValue = color === 'primary' ? 'var(--brand-primary)' : 'white';
    return (
        <Ring color={colorValue} size={size} speed={speed} bgOpacity={bgOpacity} stroke={3.5} />
    );
}