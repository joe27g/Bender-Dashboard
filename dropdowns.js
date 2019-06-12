/* puts the dropdown menu above the button if there's no room. */
function isOverflowing(butt, elem) {
    let viewportTop = document.body.scrollTop;
    let viewportBottom = viewportTop + document.documentElement.clientHeight;

    let buttonTop = butt.getBoundingClientRect().top + document.body.scrollTop;
    let buttonBottom = buttonTop + butt.offsetHeight;

    let roomBelow = viewportBottom - buttonBottom;

    return roomBelow < elem.offsetHeight;
}

window.addEventListener('resize', calcDropdowns, true);
window.addEventListener('scroll', calcDropdowns, true);

function calcDropdowns() {
    let dd = document.querySelectorAll('.dd:not(#guilds)');
    if (dd && dd.length > 0) {
        for (let i in dd) {
            if (!dd[i] || !(dd[i] instanceof Element)) continue;
            let trig = dd[i].querySelector('.dd-trigger');
            let menu = dd[i].querySelector('.dd-content');
            if (!trig || !menu) continue;

            if (menu.style.display === 'none') {
                menu.classList.remove('dd-up');
                continue; // element is hidden
            }

            if (isOverflowing(trig, menu)) {
                menu.classList.add('dd-up');
            } else {
                menu.classList.remove('dd-up');
            }
        }
    }
}

window.addEventListener('click', function(e) {
    if(e.target.closest('.dd-content label:not(.disabled)')) {
        page.openDropdown = null; // close dropdowns after selecting an option
    }
    if (window.page && e.target.closest('.dd-content') === null && e.target.closest('.dd-trigger') === null) {
        page.openDropdown = null; // close dropdowns when clicking outside them
    }
});

// auto-expand textareas
function autoExpand(field) {
	field.style.height = 'inherit';
	let computed = window.getComputedStyle(field);
	let height = parseInt(computed.getPropertyValue('border-top-width'), 10)
	             + parseInt(computed.getPropertyValue('padding-top'), 10)
	             + field.scrollHeight
	             + parseInt(computed.getPropertyValue('padding-bottom'), 10)
	             + parseInt(computed.getPropertyValue('border-bottom-width'), 10);
    if (height < 42) return; // don't make it unreadable
	field.style.height = height + 'px';
};

document.addEventListener('input', function (event) {
	if (event.target.tagName.toLowerCase() !== 'textarea') return;
	autoExpand(event.target);
}, false);
document.addEventListener('change', function (event) {
	if (event.target.tagName.toLowerCase() !== 'textarea') return;
	autoExpand(event.target);
}, false);

function autoExpandAll() {
    let ta = document.querySelectorAll('textarea');
    ta.forEach(el => {
        if (!el.value) return;
        setTimeout(() => autoExpand(el), 5);
        setTimeout(() => autoExpand(el), 50);
        setTimeout(() => autoExpand(el), 500);
    });
}
// apply syntax highlighting to all codeblocks.
function highlightAll() {
    let cb = document.querySelectorAll('pre > code.hljs');
    cb.forEach(el => {
        hljs.highlightBlock(el);
    });
}
