export default class BlurText {
    constructor(element, options = {}) {
        if (!element) return;
        this.element = element;
        this.options = {
            text: element.textContent,
            delay: 200,
            animateBy: 'words', // 'words' or 'chars'
            direction: 'top', // 'top' or 'bottom'
            threshold: 0.1,
            rootMargin: '0px',
            animationFrom: null,
            animationTo: null,
            easing: 'power2.out',
            onAnimationComplete: null,
            stepDuration: 0.35,
            ...options
        };

        this.inView = false;
        this.init();
    }

    init() {
        this.prepareText();
        this.setupIntersectionObserver();
    }

    prepareText() {
        const { text, animateBy } = this.options;
        this.element.innerHTML = '';
        this.element.style.display = 'flex';
        this.element.style.flexWrap = 'wrap';

        const elements = animateBy === 'words' ? text.split(' ') : text.split('');
        
        this.spans = elements.map((segment, index) => {
            const span = document.createElement('span');
            span.classList.add('inline-block', 'blur-text-segment');
            span.style.willChange = 'transform, filter, opacity';
            
            // Handle space character
            if (segment === ' ') {
                span.innerHTML = '&nbsp;';
            } else {
                span.textContent = segment;
            }

            this.element.appendChild(span);

            // Add non-breaking space after words (except the last one)
            if (animateBy === 'words' && index < elements.length - 1) {
                const space = document.createTextNode('\u00A0');
                this.element.appendChild(space);
            }

            return span;
        });
    }

    setupIntersectionObserver() {
        const { threshold, rootMargin } = this.options;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    this.inView = true;
                    this.animate();
                    observer.unobserve(this.element);
                }
            },
            { threshold, rootMargin }
        );
        observer.observe(this.element);
    }

    animate() {
        const { 
            direction, 
            animationFrom, 
            animationTo, 
            delay, 
            easing, 
            stepDuration, 
            onAnimationComplete 
        } = this.options;

        const defaultFrom = direction === 'top' 
            ? { filter: 'blur(10px)', opacity: 0, y: -50 } 
            : { filter: 'blur(10px)', opacity: 0, y: 50 };

        const defaultTo = [
            {
                filter: 'blur(5px)',
                opacity: 0.5,
                y: direction === 'top' ? 5 : -5,
                duration: stepDuration
            },
            { 
                filter: 'blur(0px)', 
                opacity: 1, 
                y: 0,
                duration: stepDuration
            }
        ];

        const fromSnapshot = animationFrom ?? defaultFrom;
        const toSnapshots = animationTo ?? defaultTo;

        this.spans.forEach((span, index) => {
            const tl = gsap.timeline({
                delay: (index * delay) / 1000,
                onComplete: () => {
                    if (index === this.spans.length - 1 && onAnimationComplete) {
                        onAnimationComplete();
                    }
                }
            });

            // Set initial state
            gsap.set(span, fromSnapshot);

            // Animate through snapshots
            toSnapshots.forEach(step => {
                tl.to(span, {
                    ...step,
                    ease: easing
                });
            });
        });
    }
}
