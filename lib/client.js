window.__ModuleLoader__.load({id:'dsh-free-subagents',factory(require){
const React=require('react'),h=React.createElement;
const ICON_DATA='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgcm9sZT0iaW1nIiBhcmlhLWxhYmVsPSJGcmVlIFN1YmFnZW50cyI+IDx0aXRsZT5GcmVlIFN1YmFnZW50czwvdGl0bGU+IDwhLS0gQSByb3V0aW5nIGZvcms6IG9uZSByZXF1ZXN0IGluLCB0aHJlZSBmcmVlIHJvdXRlcyBvdXQuIFRoZSBhcnJvd2hlYWRzIGFyZSB0aGUgZmFpbG92ZXIgcGF0aHMuIEJvbGQgYW5kIGRpZ2l0YWwgaW5rIHBsYXRlLCBicmFuZCBjeWFuIGdseXBoLiAtLT4gPGRlZnM+IDxsaW5lYXJHcmFkaWVudCBpZD0iZnMtcGxhdGUiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj4gPHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjMDkxYzM2Ii8+IDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzA1MTIxZiIvPiA8L2xpbmVhckdyYWRpZW50PiA8L2RlZnM+IDxyZWN0IHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgcng9IjE0IiBmaWxsPSJ1cmwoI2ZzLXBsYXRlKSIvPiA8IS0tIHRoZSB0cnVuayBhbmQgdGhlIHRocmVlIHJvdXRlcyBpdCBjYW4gdGFrZSAtLT4gPGcgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNTdlYmVlIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+IDxwYXRoIGQ9Ik0xNSAzMmgxMSIvPiA8cGF0aCBkPSJNMjYgMzJjMCAwIDYtMTMgMTUtMTMiLz4gPHBhdGggZD0iTTI2IDMyYzAgMCA2IDAgMTUgMCIvPiA8cGF0aCBkPSJNMjYgMzJjMCAwIDYgMTMgMTUgMTMiLz4gPC9nPiA8IS0tIHRoZSBzb3VyY2UgcmVxdWVzdCAtLT4gPGNpcmNsZSBjeD0iMTMiIGN5PSIzMiIgcj0iNC41IiBmaWxsPSIjNTdlYmVlIi8+IDwhLS0gdGhlIHRocmVlIGRlc3RpbmF0aW9ucyAtLT4gPGcgZmlsbD0iIzU3ZWJlZSI+IDxjaXJjbGUgY3g9IjQ1IiBjeT0iMTkiIHI9IjQuNSIvPiA8Y2lyY2xlIGN4PSI0NSIgY3k9IjMyIiByPSI0LjUiLz4gPGNpcmNsZSBjeD0iNDUiIGN5PSI0NSIgcj0iNC41Ii8+IDwvZz4gPCEtLSBtb25vZ3JhbSAtLT4gPHJlY3QgeD0iMzYiIHk9IjQyIiB3aWR0aD0iMjQiIGhlaWdodD0iMTgiIHJ4PSI2IiBmaWxsPSIjMDkxYzM2IiBzdHJva2U9IiM1N2ViZWUiIHN0cm9rZS13aWR0aD0iMiIvPiA8dGV4dCB4PSI0OCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJ1aS1zYW5zLXNlcmlmLC1hcHBsZS1zeXN0ZW0sU2Vnb2UgVUksUm9ib3RvLHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTEiIGZvbnQtd2VpZ2h0PSI3MDAiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGxldHRlci1zcGFjaW5nPSIwLjMiPkZTPC90ZXh0PiA8L3N2Zz4=';
const copy={title:'Free Subagents',intro:'Choose free-tier models for subagents and Agent Teams. Your main agent keeps its selected model.',save:'Save changes',discard:'Discard changes',refresh:'Refresh providers',reload:'Reload saved settings',empty:'Add an approved model to get started. An empty pool blocks subagent requests.',approval:'I confirm this model and account use a free allocation.',timing:'Saved settings apply to subsequent calls. A running call finishes with its starting settings.',unsupported:'Only OpenRouter, Google and NVIDIA are supported in this release.',unsaved:'Unsaved changes',saved:'Settings saved',add:'Add model',remove:'Remove',enabled:'Enabled',search:'Search models',provider:'Provider',model:'Model',general:'General',coding:'Coding',research:'Research',reasoning:'Reasoning',quick:'Quick',preferences:'Task preferences',prefHint:'Preference strength per task. Low, Medium and High are the 0–10 scores the router ranks on; they are heuristics, not benchmark results.',prefLow:'Low',prefMedium:'Medium',prefHigh:'High',effort:'Reasoning effort',effortDefault:'Provider default',effortNone:'This model reports no reasoning levels.',limits:'Fallback and limits',maxOutputTokens:'Maximum output tokens',maxAttempts:'Maximum attempts (0 = all eligible routes)',quotaCooldownMs:'Quota cooldown (minutes)',rateLimitCooldownMs:'Rate-limit cooldown (minutes)',authCooldownMs:'Authentication cooldown (minutes)',errorCooldownMs:'Error cooldown (minutes)',maxCooldownMs:'Maximum cooldown (minutes)',unavailable:'Not in current catalog',unknown:'Connection status unknown',missing:'No credential configured',connected:'Credential configured',loading:'Loading…',readonly:'Settings are unavailable or read-only in this profile.',catalogFailed:'The provider catalog could not be read.',remoteUnavailable:'The app connection is not available, so providers and saved settings cannot be read yet.'};
const unwrap=r=>{if(!r.ok)throw new Error(r.error?.message||'Request failed');return r.value};
const EDITABLE=['chain','maxOutputTokens','maxAttempts','quotaCooldownMs','rateLimitCooldownMs','authCooldownMs','errorCooldownMs','maxCooldownMs'];
return {inject:['slots','locale','remote','remote.settings','remote.llm','remote.credentials','remote.session'],apply(ctx){
ctx.effect(()=>ctx.locale.register('free-subagents',{en:copy}));const t=ctx.locale.bind('free-subagents');
function Page(){
const [form,S]=React.useState(null),[draft,D]=React.useState(null),[groups,G]=React.useState([]),[status,Q]=React.useState(''),[err,E]=React.useState(''),[busy,B]=React.useState(false),[writable,W]=React.useState(false),[provider,P]=React.useState(''),[model,M]=React.useState(''),[search,F]=React.useState(''),[approved,A]=React.useState(false);const alive=React.useRef(true),generation=React.useRef(0),addRef=React.useRef(null);
async function load(){try{const result=unwrap(await ctx.remote.settings.describe());if(!alive.current)return;const f=result.namespaces.find(x=>x.ns==='free-router');S(f||null);D(f?structuredClone(f.value):null);W(result.writable);Q('');E('')}catch(e){if(alive.current)E(e.message);return false}return true}
async function catalog(){const gen=++generation.current;Q(t('loading'));E('');try{
const [pr,di,se]=await Promise.all([ctx.remote.llm.listProviders(),ctx.remote.llm.listConfigurableProviders(),ctx.remote.settings.describe()]);
const providers=unwrap(pr)||[],directory=unwrap(di)||[],settings=unwrap(se);const refs=new Set();
const rows=providers.filter(p=>p.id!=='free-auto').map(p=>{const decl=directory.find(x=>x.provider===p.id);let config=settings.namespaces.find(x=>x.ns===decl?.settingsNs)?.value;for(const k of decl?.settingsPath||[])config=config?.[k];const names=config?.apiKeyEnv?[config.apiKeyEnv]:[`${p.id.toUpperCase().replace(/[^A-Z0-9]+/g,'_')}_API_KEY`,...(decl?.nativeAuth?.env||[])];names.forEach(x=>refs.add(x));return {...p,names}});
if(!alive.current||gen!==generation.current)return;
G(rows.map(p=>({...p,models:[],failure:undefined,connected:null})));
let credentials={},credentialError=false;const list=[...refs];for(let i=0;i<list.length;i+=64){try{Object.assign(credentials,unwrap(await ctx.remote.credentials.describe(list.slice(i,i+64))))}catch{credentialError=true}}
let cat=null,catError=null;try{cat=unwrap(await ctx.remote.session.modelCatalog())}catch(e){catError=e}
if(!alive.current||gen!==generation.current)return;
G(rows.map(p=>({...p,models:(cat&&cat.groups||[]).find(g=>g.id===p.id)?.models||[],failure:(cat&&cat.failures||[]).find(g=>g.id===p.id)?.message,connected:credentialError?null:p.names.some(n=>credentials[n]?.configured)})));
if(catError)E(t('catalogFailed')+': '+(catError&&catError.message?catError.message:String(catError)));
Q('');
}catch(e){if(alive.current){E(t('catalogFailed')+': '+(e&&e.message?e.message:String(e)));Q('')}}}
React.useEffect(()=>{alive.current=true;load();catalog();const off=[];try{const remote=ctx.remote;for(const event of ['credentials/record-updated','credentials/reference-updated','llm/adapters-updated'])if(typeof remote.$on==='function')off.push(remote.$on(event,catalog));}catch(e){if(alive.current)E(t('remoteUnavailable')+': '+(e&&e.message?e.message:String(e)))}off.push(ctx.on('connection/reset',catalog));return()=>{alive.current=false;generation.current++;off.forEach(f=>f())}},[]);
const PREF={low:3,medium:5,high:8};const bucket=s=>s>=8?'high':s>=5?'medium':'low';const effortsOf=r=>{const g=groups.find(x=>x.id===r.provider);const m=g?.models.find(x=>x.id===r.model);return m?.reasoning?.efforts??[]};const dirty=form&&draft&&JSON.stringify(form.value)!==JSON.stringify(draft);const edit=(k,v)=>D(d=>({...d,[k]:v}));const routeEdit=(i,k,v)=>edit('chain',draft.chain.map((r,n)=>i===n?{...r,[k]:v}:r));
async function save(){B(true);E('');try{const ops=EDITABLE.filter(k=>k in draft).map(k=>({op:'set',path:[k],value:draft[k]}));if(!ops.length)throw new Error(t('readonly'));unwrap(await ctx.remote.settings.mutate('free-router',ops,form.revision));const loaded=await load();if(loaded!==false&&alive.current)Q(t('saved'))}catch(e){if(alive.current)E(e.message)}finally{if(alive.current)B(false)}}
const row=groups.find(g=>g.id===provider),models=(row?.models||[]).filter(m=>(provider!=='openrouter'||m.id.endsWith(':free'))&&(`${m.name} ${m.id}`).toLowerCase().includes(search.toLowerCase()));
const button=(label,onClick,disabled=false,extra={})=>h('button',{type:'button',onClick,disabled:disabled||busy,...extra},label);
const CSS=`/* Free Subagents settings page - DSH design tokens */
.fr-settings{max-width:900px;color:var(--dsw-alias-label-primary);font:inherit}
.fr-head{display:flex;flex-direction:column;gap:4px;margin:0 0 16px}
.fr-title{margin:0;font-size:20px;line-height:28px;font-weight:600;letter-spacing:-.01em}
.fr-intro{margin:0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px;max-width:68ch}
.fr-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 16px}
.fr-pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;line-height:18px;padding:3px 10px;border-radius:999px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}
.fr-pill-warn{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 14%,transparent);color:var(--dsw-alias-state-warn-primary)}
.fr-pill-ok{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent);color:var(--dsw-alias-state-success-primary)}
.fr-note{margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.fr-banner{margin:0 0 16px;padding:10px 14px;border-radius:var(--dsw-radius-md);font-size:13px;line-height:20px;border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 40%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent)}
.fr-btn{appearance:none;font:inherit;font-size:13px;line-height:20px;font-weight:500;padding:7px 14px;border-radius:var(--dsw-radius-md);border:1px solid transparent;cursor:pointer;white-space:nowrap;transition:background-color .12s ease,border-color .12s ease,color .12s ease}
.fr-btn:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color);outline-offset:2px}
.fr-btn:disabled{opacity:.4;cursor:not-allowed}
.fr-btn-ghost{background:transparent;border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}
.fr-btn-ghost:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.fr-btn-danger{color:var(--dsw-alias-state-error-primary);border-color:transparent}
.fr-btn-danger:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent)}
.fr-btn-primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border-color:transparent}
.fr-btn-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}
.fr-pool{border:none;padding:0;margin:0 0 18px;min-width:0}
.fr-pool>legend,.fr-panel>legend{padding:0;margin:0 0 10px;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}
.fr-card{border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-layer-1);padding:14px 16px;margin:0 0 12px;min-width:0;transition:border-color .12s ease}
.fr-card:hover{border-color:var(--dsw-alias-border-l4)}
.fr-card-head{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:0 0 12px;padding:0 0 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.fr-card-titles{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1 1 220px}
.fr-card-title{margin:0;font-size:14px;font-weight:600;line-height:20px;color:var(--dsw-alias-label-primary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.fr-mono{font-family:var(--dsw-font-mono);font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fr-grow{flex:1 1 auto;min-width:0}
.fr-switch{display:inline-flex;align-items:center;gap:8px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);cursor:pointer;user-select:none}
.fr-switch input{position:absolute;opacity:0;width:0;height:0}
.fr-switch-track{width:32px;height:18px;border-radius:999px;background:var(--dsw-alias-border-l3);position:relative;flex:none;transition:background-color .15s ease}
.fr-switch-track:after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-label-primary-foreground);box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s ease}
.fr-switch input:checked+.fr-switch-track{background:var(--dsw-alias-brand-primary)}
.fr-switch input:checked+.fr-switch-track:after{transform:translateX(14px)}
.fr-switch input:focus-visible+.fr-switch-track{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color);outline-offset:2px}
.fr-details{border-top:1px solid var(--dsw-alias-border-l1);padding-top:12px;margin-top:12px}
.fr-summary{cursor:pointer;font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary);list-style:none;display:flex;align-items:center;gap:6px}
.fr-summary::-webkit-details-marker{display:none}
.fr-summary:after{content:">";display:inline-block;transition:transform .15s ease;color:var(--dsw-alias-label-tertiary)}
.fr-details[open]>.fr-summary:after{transform:rotate(90deg)}
.fr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-top:12px}
.fr-seg{border:none;padding:0;margin:0;min-width:0}
.fr-seg>legend{padding:0;margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}
.fr-seg-group{display:inline-flex;padding:2px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-interactive-bg-hover);gap:2px}
.fr-seg-btn{appearance:none;font:inherit;font-size:12px;line-height:18px;font-weight:500;padding:5px 12px;border:none;border-radius:calc(var(--dsw-radius-md) - 2px);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;transition:background-color .12s ease,color .12s ease}
.fr-seg-btn:hover{color:var(--dsw-alias-label-primary)}
.fr-seg-btn-on{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 20%,transparent);color:var(--dsw-alias-label-primary);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dsw-alias-brand-primary) 55%,transparent)}
.fr-seg-btn:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color);outline-offset:1px}
.fr-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.fr-field-label{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.fr-field-row{display:flex;align-items:center;gap:12px;justify-content:space-between;padding:6px 0}
.fr-field-row>.fr-field-label{flex:1 1 auto}
.fr-select,.fr-input{appearance:none;font:inherit;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);padding:7px 10px;min-width:0;max-width:100%;box-sizing:border-box}
.fr-select:focus-visible,.fr-input:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color);outline-offset:1px;border-color:var(--dsw-alias-border-l4)}
.fr-input-num{width:130px;flex:none;text-align:right}
.fr-panel{border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-layer-1);padding:14px 16px;margin:0 0 12px;min-width:0}
.fr-add-row{display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin-top:12px}
.fr-check{display:inline-flex;align-items:center;gap:8px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);cursor:pointer}
.fr-actions{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:4px;padding-top:16px;border-top:1px solid var(--dsw-alias-border-l1)}`;
const field=(label,control)=>h('label',{className:'fr-field'},h('span',{className:'fr-field-label'},label),control);
const fieldRow=(label,control)=>h('div',{className:'fr-field-row'},h('label',{className:'fr-field-label'},label),control);
const select=(props,...options)=>h('select',{className:'fr-select',...props},...options);
const number=(props)=>h('input',{className:'fr-input fr-input-num',type:'number',...props});
const segButton=(b,on,onClick)=>button(t('pref'+b[0].toUpperCase()+b.slice(1)),onClick,false,{'aria-pressed':String(on),className:'fr-seg-btn'+(on?' fr-seg-btn-on':'')});
const taskGroup=(r,i,k)=>h('fieldset',{key:k,className:'fr-seg'},h('legend',null,t(k)),h('div',{className:'fr-seg-group'},...['low','medium','high'].map(b=>segButton(b,bucket(r.tasks?.[k]??r.tasks?.general??5)===b,()=>routeEdit(i,'tasks',{...r.tasks,[k]:PREF[b]})))));
const routeCard=(r,i)=>h('div',{key:r.provider+'/'+r.model,className:'fr-card',role:'group','aria-label':r.label||r.model},
  h('div',{className:'fr-card-head'},
    h('div',{className:'fr-card-titles'},
      h('h3',{className:'fr-card-title'},r.label||r.model),
      h('span',{className:'fr-mono',title:r.provider+' / '+r.model},r.provider+' / '+r.model)),
    groups.find(g=>g.id===r.provider)?.models.some(m=>m.id===r.model)?null:h('span',{className:'fr-pill fr-pill-warn'},t('unavailable')),
    h('span',{className:'fr-grow'}),
    h('label',{className:'fr-switch'},
      h('input',{type:'checkbox',checked:r.enabled!==false,onChange:e=>routeEdit(i,'enabled',e.target.checked)}),
      h('span',{className:'fr-switch-track','aria-hidden':'true'}),
      h('span',null,t('enabled'))),
    button(t('remove'),()=>{edit('chain',draft.chain.filter((_,n)=>n!==i));addRef.current?.focus()},false,{className:'fr-btn fr-btn-ghost fr-btn-danger'})),
  fieldRow(t('effort'),select({value:r.reasoningEffort??'',onChange:e=>routeEdit(i,'reasoningEffort',e.target.value===''?undefined:e.target.value)},
    h('option',{value:''},t('effortDefault')),
    effortsOf(r).map(x=>h('option',{key:x.id,value:x.id},x.name||x.id)))),
  h('details',{className:'fr-details'},
    h('summary',{className:'fr-summary'},t('preferences')),
    h('p',{className:'fr-note'},t('prefHint')),
    h('div',{className:'fr-grid'},['general','coding','research','reasoning','quick'].map(k=>taskGroup(r,i,k))),
    ...['maxOutputTokens','maxTools'].map(k=>fieldRow(k,number({min:k==='maxTools'?0:1,step:1,value:r[k]??'',onChange:e=>routeEdit(i,k,e.target.value===''?undefined:e.target.valueAsNumber)})))));
const addPanel=()=>h('fieldset',{className:'fr-panel'},
  h('legend',{className:'fr-eyebrow'},t('add')),
  h('div',{className:'fr-grid'},
    field(t('provider'),select({ref:addRef,value:provider,onChange:e=>{P(e.target.value);M('');A(false)}},
      h('option',{value:''},'-'),
      groups.map(g=>h('option',{key:g.id,value:g.id,disabled:!['openrouter','google','nvidia'].includes(g.id)||g.connected!==true},
        `${g.name} - ${g.connected===null?t('unknown'):g.connected?t('connected'):t('missing')}`)))),
    field(t('model'),select({value:model,onChange:e=>{M(e.target.value);A(false)}},
      h('option',{value:''},'-'),
      models.map(m=>h('option',{key:m.id,value:m.id},m.name+' - '+m.id))))),
  field(t('search'),h('input',{className:'fr-input',type:'search',value:search,onChange:e=>F(e.target.value)})),
  row?.failure?h('p',{className:'fr-note fr-pill-warn'},row.failure):null,
  h('p',{className:'fr-note'},t('unsupported')),
  h('div',{className:'fr-add-row'},
    h('label',{className:'fr-check'},h('input',{type:'checkbox',checked:approved,onChange:e=>A(e.target.checked)}),h('span',null,t('approval'))),
    button(t('add'),()=>{edit('chain',[...draft.chain,{provider,model,freeTier:true,enabled:true,label:row.models.find(m=>m.id===model)?.name,tasks:{general:5,coding:5,research:5,reasoning:5,quick:5}}]);M('');A(false)},!approved||!model||row?.connected!==true||draft.chain.some(r=>r.provider===provider&&r.model===model),{className:'fr-btn fr-btn-primary'})));
const limitsPanel=()=>h('fieldset',{className:'fr-panel',disabled:busy||!writable},
  h('legend',{className:'fr-eyebrow'},t('limits')),
  ...['maxOutputTokens','maxAttempts'].map(k=>fieldRow(t(k),number({min:k==='maxAttempts'?0:1,step:1,value:draft[k],onChange:e=>edit(k,e.target.valueAsNumber)}))),
  h('details',{className:'fr-details'},
    h('summary',{className:'fr-summary'},'Advanced cooldowns'),
    ...['quotaCooldownMs','rateLimitCooldownMs','authCooldownMs','errorCooldownMs','maxCooldownMs'].map(k=>fieldRow(t(k),number({min:1/60000,step:'any',value:draft[k]/60000,onChange:e=>edit(k,Math.round(e.target.valueAsNumber*60000))})))),
  h('p',{className:'fr-note'},t('timing')));
const toolbar=()=>h('div',{className:'fr-toolbar'},
  button(t('refresh'),catalog,false,{className:'fr-btn fr-btn-ghost'}),
  button(t('reload'),load,false,{className:'fr-btn fr-btn-ghost'}),
  status?h('span',{className:status===t('saved')?'fr-pill fr-pill-ok':'fr-pill'},status):null,
  dirty?h('span',{className:'fr-pill fr-pill-warn'},t('unsaved')):null);
const actions=()=>h('div',{className:'fr-actions'},
  button(t('save'),save,!dirty||!writable,{className:'fr-btn fr-btn-primary'}),
  button(t('discard'),()=>D(structuredClone(form.value)),!dirty,{className:'fr-btn fr-btn-ghost'}));
return h('section',{className:'fr-settings'},
  h('style',null,CSS),
  h('header',{className:'fr-head'},h('h2',{className:'fr-title'},t('title')),h('p',{className:'fr-intro'},t('intro'))),
  toolbar(),
  err?h('p',{className:'fr-banner',role:'alert'},err):null,
  !draft?h('p',{className:'fr-note'},t('readonly')):h(React.Fragment,null,
    h('fieldset',{className:'fr-pool',disabled:busy||!writable},
      h('legend',{className:'fr-eyebrow'},'Model pool'),
      !draft.chain.length?h('p',{className:'fr-note'},t('empty')):null,
      draft.chain.map(routeCard)),
    addPanel(),
    limitsPanel(),
    actions()));
}
ctx.slots.inject('settings.section',()=>ctx.slots.register({name:'settings.section',id:'free-subagents',order:35,label:()=>t('title'),locale:'free-subagents'},Page));
ctx.slots.inject('settings.section.icon',()=>ctx.slots.register({name:'settings.section.icon',id:'free-subagents',locale:'free-subagents'},function FreeSubagentsIcon(props){const size=(props&&props.size)||20;return h('img',{src:ICON_DATA,alt:'','aria-hidden':true,width:size,height:size,style:{objectFit:'contain',display:'block',flexShrink:0}})}));
ctx.slots.inject('plugins.bundle.config',()=>ctx.slots.register({name:'plugins.bundle.config',key:'dsh-free-subagents',locale:'free-subagents'},Page));
}};
}});
