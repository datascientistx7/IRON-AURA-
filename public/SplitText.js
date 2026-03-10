export default class SplitText {
    constructor(element, options = {}) {
        if (!element) return;
        this.element = element;
        this.options = {
            text: element.textContent,
            delay: 0,
            duration: 0.6,
            ease: "power3.out",
            splitType: "chars",
            from: { opacity: 0, y: 40 },
            to: { opacity: 1, y: 0 },
            threshold: 0.1,
            rootMargin: "0px",
            onLetterAnimationComplete: null,
            ...options
        };

        this.init();
    }

    init() {
        this.splitText();
        this.setupIntersectionObserver();
    }

    splitText() {
        const { text, splitType } = this.options;
        this.element.innerHTML = '';

        // Split text into words first to handle spacing reasonably
        const words = text.split(' ');

        words.forEach((word, wordIndex) => {
            const wordSpan = document.createElement('span');
            wordSpan.style.display = 'inline-block';
            wordSpan.style.whiteSpace = 'nowrap';

            if (splitType === 'chars') {
                const chars = word.split('');
                chars.forEach((char) => {
                    const charSpan = document.createElement('span');
                    charSpan.textContent = char;
                    charSpan.style.display = 'inline-block';
                    charSpan.classList.add('split-char');
                    wordSpan.appendChild(charSpan);
                });
            } else {
                wordSpan.textContent = word;
                wordSpan.classList.add('split-word');
            }

            this.element.appendChild(wordSpan);

            // Add space between words
            if (wordIndex < words.length - 1) {
                this.element.appendChild(document.createTextNode(' '));
            }
        });

        this.targets = this.element.querySelectorAll(splitType === 'chars' ? '.split-char' : '.split-word');
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animate();
                    observer.unobserve(this.element);
                }
            });
        }, {
            threshold: this.options.threshold,
            rootMargin: this.options.rootMargin
        });

        observer.observe(this.element);
    }

    animate() {
        const { delay, duration, ease, from, to, onLetterAnimationComplete } = this.options;

        gsap.fromTo(this.targets,
            from,
            {
                ...to,
                duration: duration,
                ease: ease,
                stagger: delay / 1000, // Convert ms to seconds
                onComplete: () => {
                    if (onLetterAnimationComplete) onLetterAnimationComplete();
                }
            }
        );
    }
}
