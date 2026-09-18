const $=s=>document.querySelector(s);
const messagesEl=$("#messages"), input=$("#input"), form=$("#chatForm"), sendBtn=$("#sendBtn");
const chatList=$("#chatList"), sidebar=$("#sidebar"), toast=$("#toast");
let chats=JSON.parse(localStorage.getItem("myai_chats")||"[]");
let currentId=localStorage.getItem("myai_current")||null;

function save(){localStorage.setItem("myai_chats",JSON.stringify(chats));if(currentId)localStorage.setItem("myai_current",currentId)}
function id(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function current(){return chats.find(c=>c.id===currentId)}
function toastMsg(t){toast.textContent=t;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),1800)}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function markdown(s){
  let x=escapeHtml(s);
  x=x.replace(/```([\s\S]*?)```/g,(_,c)=>`<pre><code>${c.trim()}</code></pre>`);
  x=x.replace(/`([^`]+)`/g,"<code>$1</code>");
  x=x.replace(/^### (.*)$/gm,"<h3>$1</h3>").replace(/^## (.*)$/gm,"<h2>$1</h2>").replace(/^# (.*)$/gm,"<h1>$1</h1>");
  x=x.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\*(.*?)\*/g,"<em>$1</em>");
  x=x.split(/\n{2,}/).map(p=>p.startsWith("<pre>")||p.startsWith("<h")?p:`<p>${p.replace(/\n/g,"<br>")}</p>`).join("");
  return x;
}
function render(){
  messagesEl.innerHTML="";
  const c=current();
  if(!c||!c.messages.length){
    messagesEl.innerHTML=`<div id="welcome" class="welcome"><div class="welcome-icon">✦</div><h1>How can I help?</h1><p>Your personal AI chat. Ask questions, explore ideas, or work through code.</p><div class="suggestions"><button>Explain something to me simply</button><button>Help me build a website</button><button>Teach me a difficult topic</button></div></div>`;
    messagesEl.querySelectorAll(".suggestions button").forEach(b=>b.onclick=()=>{input.value=b.textContent;form.requestSubmit()});
  } else c.messages.forEach((m,i)=>addMessage(m.role,m.content,i));
  chatList.innerHTML=chats.slice().reverse().map(c=>`<div class="chat-item ${c.id===currentId?"active":""}" data-id="${c.id}">${escapeHtml(c.title||"New chat")}</div>`).join("");
  chatList.querySelectorAll(".chat-item").forEach(x=>x.onclick=()=>{currentId=x.dataset.id;save();render();sidebar.classList.remove("open")});
  messagesEl.scrollTop=messagesEl.scrollHeight;
}
function addMessage(role,text,index){
  const el=document.createElement("div");el.className=`msg ${role}`;
  el.innerHTML=`<div class="avatar">${role==="user"?"U":"✦"}</div><div class="content">${role==="user"?escapeHtml(text).replace(/\n/g,"<br>"):markdown(text)}<div class="actions"><button data-copy>Copy</button>${role==="assistant"?`<button data-regenerate>Regenerate</button>`:""}</div></div>`;
  el.querySelector("[data-copy]").onclick=async()=>{await navigator.clipboard.writeText(text);toastMsg("Copied")};
  const regen=el.querySelector("[data-regenerate]"); if(regen) regen.onclick=()=>regenerate(index);
  messagesEl.appendChild(el);
}
function ensureChat(){
  if(!currentId||!current()){currentId=id();chats.push({id:currentId,title:"New chat",messages:[]});save()}
  return current();
}
async function send(){
  const text=input.value.trim();if(!text)return;
  const c=ensureChat();c.messages.push({role:"user",content:text});if(c.messages.length===1)c.title=text.slice(0,40);input.value="";input.style.height="auto";save();render();
  setBusy(true);
  try{
    const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:c.messages})});
    const data=await r.json();if(!r.ok)throw new Error(data.error||"Request failed");
    c.messages.push({role:"assistant",content:data.content||"No response received."});save();render();
  }catch(e){c.messages.push({role:"assistant",content:`**Error:** ${e.message}`});save();render()}
  finally{setBusy(false)}
}
async function regenerate(index){
  const c=current(); if(!c)return;
  c.messages=c.messages.slice(0,index);save();render();
  setBusy(true);
  try{
    const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:c.messages})});
    const data=await r.json();if(!r.ok)throw new Error(data.error||"Request failed");
    c.messages.push({role:"assistant",content:data.content||"No response received."});save();render();
  }catch(e){c.messages.push({role:"assistant",content:`**Error:** ${e.message}`});save();render()}
  finally{setBusy(false)}
}
function setBusy(b){sendBtn.disabled=b;input.disabled=b;sendBtn.textContent=b?"…":"➤"}
form.onsubmit=e=>{e.preventDefault();send()};
input.oninput=()=>{input.style.height="auto";input.style.height=Math.min(input.scrollHeight,180)+"px"};
input.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();form.requestSubmit()}};
$("#newChat").onclick=()=>{currentId=id();chats.push({id:currentId,title:"New chat",messages:[]});save();render();input.focus();sidebar.classList.remove("open")};
$("#clearBtn").onclick=()=>{if(confirm("Delete all local chats?")){chats=[];currentId=null;save();render()}};
$("#menuBtn").onclick=()=>sidebar.classList.toggle("open");
$("#themeBtn").onclick=()=>{const d=document.documentElement;d.dataset.theme=d.dataset.theme==="dark"?"light":"dark";localStorage.setItem("myai_theme",d.dataset.theme)};
document.documentElement.dataset.theme=localStorage.getItem("myai_theme")||"dark";
render();
