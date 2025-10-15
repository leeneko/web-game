// ~/src/components/CountdownTimer.js
import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ endTime }) => {
    const calculateTimeLeft = () => {
        const difference = new Date(endTime).getTime() - new Date().getTime();
        if (difference <= 0) return null;
        return {
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    if (!timeLeft) {
        return <span>완료!</span>;
    }

    const format = (t) => (t < 10 ? `0${t}` : t);
    return (
        <span>
            {format(timeLeft.hours)}:{format(timeLeft.minutes)}:{format(timeLeft.seconds)}
        </span>
    );
};
export default React.memo(CountdownTimer);