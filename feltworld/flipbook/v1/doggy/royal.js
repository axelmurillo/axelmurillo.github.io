// Private preview settings; reader motion/depth/magic remain owned by the approved runtime.
(()=>{
 const root=document.documentElement,select=document.getElementById('theme-select'),tools=document.querySelector('.reader-tools'),key='felt-reader-sky-v1',media=matchMedia('(prefers-color-scheme:light)');
 let theme='system';try{const saved=localStorage.getItem(key);if(['system','light','dark'].includes(saved))theme=saved;}catch{}
 const apply=()=>{root.dataset.theme=theme;select.value=theme;const light=theme==='light'||(theme==='system'&&media.matches);document.querySelector('meta[name="theme-color"]').content=light?'#edf1f8':'#101923';};
 apply();select.addEventListener('change',()=>{theme=select.value;try{localStorage.setItem(key,theme);}catch{}apply();});media.addEventListener('change',apply);
 document.addEventListener('pointerdown',e=>{if(tools.open&&!tools.contains(e.target))tools.open=false;});
 document.addEventListener('focusin',e=>{if(tools.open&&!tools.contains(e.target))tools.open=false;});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&tools.open&&!document.getElementById('editor').open){tools.open=false;tools.querySelector('summary').focus({preventScroll:true});e.preventDefault();}});
 // The editor opens above the menu and restores focus without reopening the disclosure.
 document.getElementById('text-settings').addEventListener('click',()=>{tools.open=false;});
 document.getElementById('editor').addEventListener('close',()=>{tools.open=true;document.getElementById('text-settings').focus({preventScroll:true});});
})();
