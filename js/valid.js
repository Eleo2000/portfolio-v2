/******* contact modal — open/close robuste xD *******/
/* cibles requêtées à l'usage et null-safe : avant, `blur`, `section`
   et `navy` n'étaient jamais déclarés — `blur` résolvait en
   window.blur() (fonction → .style undefined → TypeError), `navy` en
   null → le close crashait AVANT le reset du flag et verrouillait le
   modal pour toujours. */

let is_howModalMail = false;
let other = false;

const modalTargets = () => ({
    form: document.querySelector('.contact_form'),
    blur: document.querySelector('.blur'),
    sections: document.querySelectorAll('.section'),
    navy: document.querySelector('.navy'),
    flexa: document.querySelector('.flexa'),
});

function back() {
    // flag reset EN PREMIER : un throw plus bas ne doit jamais
    // verrouiller la réouverture
    is_howModalMail = false;
    const { form, blur, sections, navy, flexa } = modalTargets();
    if (form) form.style.display = 'none';
    if (blur) {
        blur.style.zIndex = '42';
        blur.classList.remove('blur-active');
    }
    sections.forEach((e) => e.classList.remove('activa'));
    document.body.style.overflow = '';
    if (navy) navy.style.display = '';
    if (flexa) flexa.style.display = 'flex';
}

function show() {
    if (is_howModalMail) {
        back();
        return;
    }
    const { form, blur, sections, navy, flexa } = modalTargets();
    if (!form) return;
    is_howModalMail = true;
    other = true;
    form.style.display = 'grid';
    if (blur) {
        blur.style.zIndex = '50';
        blur.classList.add('blur-active');
    }
    sections.forEach((e) => e.classList.add('activa'));
    document.body.style.overflow = 'hidden';
    if (navy) navy.style.display = 'none';
    if (flexa) flexa.style.display = 'none';
}

// Escape ferme aussi le modal (cohérent avec menu + focus cards)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && is_howModalMail) back();
});


