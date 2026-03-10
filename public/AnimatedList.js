/**
 * AnimatedList Utility
 * Handles rendering a list of items with GSAP entrance animations,
 * scroll gradients, and keyboard navigation.
 */

export default class AnimatedList {
    constructor(container, options = {}) {
        if (!container) return;
        this.container = container;
        this.options = {
            items: [],
            onItemSelect: (item, index) => { },
            showGradients: true,
            enableArrowNavigation: true,
            displayScrollbar: true,
            ...options
        };
        this.activeIndex = -1;
        this.init();
    }

    init() {
        this.render();
        if (this.options.enableArrowNavigation) {
            this.setupArrowNavigation();
        }
        this.setupScrollListener();
    }

    render() {
        this.container.innerHTML = '';
        this.container.classList.add('animated-list-container');

        if (!this.options.displayScrollbar) {
            this.container.classList.add('hide-scrollbar');
        }

        // List Wrapper (for scrolling)
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'animated-list-wrapper';

        // Items Container
        this.listEl = document.createElement('div');
        this.listEl.className = 'animated-list';

        this.options.items.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'animated-list-item';

            // Determine if item is an object (like cart item) or a string
            const itemLabel = typeof item === 'string' ? item : (item.name || `Item ${index + 1}`);
            const itemInfo = typeof item === 'string' ? '' : `₹${item.price.toLocaleString('en-IN')} x ${item.qty}`;

            itemEl.innerHTML = `
        <span class="item-name">${itemLabel}</span>
        ${itemInfo ? `<span class="item-info">${itemInfo}</span>` : ''}
      `;

            itemEl.dataset.index = index;

            itemEl.addEventListener('click', () => {
                this.selectItem(index);
            });

            this.listEl.appendChild(itemEl);

            // Entrance Animation
            gsap.from(itemEl, {
                opacity: 0,
                y: 20,
                duration: 0.4,
                delay: index * 0.05,
                ease: "power2.out"
            });
        });

        this.wrapper.appendChild(this.listEl);
        this.container.appendChild(this.wrapper);

        // Gradients
        if (this.options.showGradients) {
            this.topGradient = document.createElement('div');
            this.topGradient.className = 'list-gradient top';
            this.bottomGradient = document.createElement('div');
            this.bottomGradient.className = 'list-gradient bottom';
            this.container.appendChild(this.topGradient);
            this.container.appendChild(this.bottomGradient);
            this.updateGradients();
        }
    }

    setupScrollListener() {
        if (this.wrapper) {
            this.wrapper.addEventListener('scroll', () => this.updateGradients());
        }
    }

    updateGradients() {
        if (!this.options.showGradients || !this.wrapper) return;

        const { scrollTop, scrollHeight, clientHeight } = this.wrapper;

        // Top gradient visibility
        if (this.topGradient) {
            this.topGradient.style.opacity = scrollTop > 10 ? '1' : '0';
        }

        // Bottom gradient visibility
        if (this.bottomGradient) {
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
            this.bottomGradient.style.opacity = isAtBottom ? '0' : '1';
        }
    }

    selectItem(index) {
        const items = this.listEl.querySelectorAll('.animated-list-item');
        items.forEach(el => el.classList.remove('active'));

        if (index >= 0 && index < items.length) {
            this.activeIndex = index;
            const activeEl = items[index];
            activeEl.classList.add('active');
            activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            this.options.onItemSelect(this.options.items[index], index);
        }
    }

    setupArrowNavigation() {
        const handleKeyDown = (e) => {
            // Check if checkout is open
            const checkoutModal = document.getElementById('checkoutOverlay');
            if (checkoutModal && checkoutModal.getAttribute('aria-hidden') === 'false') {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.selectItem((this.activeIndex + 1) % this.options.items.length);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const nextIndex = this.activeIndex <= 0 ? this.options.items.length - 1 : this.activeIndex - 1;
                    this.selectItem(nextIndex);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
    }
}
