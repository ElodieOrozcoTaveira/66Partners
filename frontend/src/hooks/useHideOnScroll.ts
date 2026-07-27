import { useEffect, useRef, useState } from "react";

export function useHideOnScroll(threshold = 10) {
    const [hidden, setHidden] = useState(false);
    const lastY = useRef(0);

    useEffect(() => {
        lastY.current = window.scrollY;

        function onScroll() {
            const currentY = window.scrollY;
            const delta = currentY - lastY.current;

            if (Math.abs(delta) < threshold) return;

            setHidden(currentY > 0 && delta > 0);
            lastY.current = currentY;
        }

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [threshold]);

    return hidden;
}
