// Private preview settings; reader motion/depth/magic remain owned by the approved runtime.
(()=>{
 const root=document.documentElement,tools=document.querySelector('.reader-tools');
 root.dataset.theme='dark';
 document.querySelector('meta[name="theme-color"]').content='#101923';
 try{localStorage.removeItem('felt-reader-sky-v1');}catch{}
 document.addEventListener('pointerdown',e=>{if(tools.open&&!tools.contains(e.target))tools.open=false;});
 document.addEventListener('focusin',e=>{if(tools.open&&!tools.contains(e.target))tools.open=false;});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&tools.open&&!document.getElementById('editor').open){tools.open=false;tools.querySelector('summary').focus({preventScroll:true});e.preventDefault();}});
 // The editor opens above the menu and restores focus without reopening the disclosure.
 document.getElementById('text-settings').addEventListener('click',()=>{tools.open=false;});
 document.getElementById('editor').addEventListener('close',()=>{tools.open=true;document.getElementById('text-settings').focus({preventScroll:true});});
})();
