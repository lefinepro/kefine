import{A as e,B as t,C as n,V as r,_ as i,ot as a,q as o,r as s,y as c}from"./BM1uQiqP.js";import{f as l,g as u,i as d,l as f,o as p,t as m}from"./DLhc71Z4.js";import{s as h}from"./CCkb-7M-2.js";import{t as g}from"./CRWLuA6A2.js";function _(){try{return t.returnOpenHref(`${a.SECURE_SITE_SDK_ORIGIN}/loading`,`popupWindow`,`width=600,height=800,scrollbars=yes`)}catch{throw Error(`Could not open social popup`)}}async function v(){c.push(`ConnectingFarcaster`);let t=i.getAuthConnector();if(t&&!s.getAccountData()?.farcasterUrl)try{let{url:e}=await t.provider.getFarcasterUri();s.setAccountProp(`farcasterUrl`,e,s.state.activeChain)}catch(t){c.goBack(),e.showError(t)}}async function y(a){c.push(`ConnectingSocial`);let l=i.getAuthConnector(),u=null;try{let e=setTimeout(()=>{throw Error(`Social login timed out. Please try again.`)},45e3);if(l&&a){if(t.isTelegram()||(u=_()),u)s.setAccountProp(`socialWindow`,o(u),s.state.activeChain);else if(!t.isTelegram())throw Error(`Could not create social popup`);let{uri:n}=await l.provider.getSocialRedirectUri({provider:a});if(!n)throw u?.close(),Error(`Could not fetch the social redirect uri`);if(u&&(u.location.href=n),t.isTelegram()){r.setTelegramSocialProvider(a);let e=t.formatTelegramSocialLoginUrl(n);t.openHref(e,`_top`)}clearTimeout(e)}}catch(r){u?.close();let i=t.parseError(r);e.showError(i),n.sendEvent({type:`track`,event:`SOCIAL_LOGIN_ERROR`,properties:{provider:a,message:i}})}}async function b(e){s.setAccountProp(`socialProvider`,e,s.state.activeChain),n.sendEvent({type:`track`,event:`SOCIAL_LOGIN_STARTED`,properties:{provider:e}}),e===`farcaster`?await v():await y(e)}var x=f`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    border-radius: ${({borderRadius:e})=>e[20]};
    overflow: hidden;
  }

  wui-icon {
    width: 100%;
    height: 100%;
  }
`,S=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},C=class extends l{constructor(){super(...arguments),this.logo=`google`}render(){return u`<wui-icon color="inherit" size="inherit" name=${this.logo}></wui-icon> `}};C.styles=[p,x],S([h()],C.prototype,`logo`,void 0),C=S([m(`wui-logo`)],C);var w=f`
  :host {
    width: 100%;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${({spacing:e})=>e[3]};
    width: 100%;
    background-color: transparent;
    border-radius: ${({borderRadius:e})=>e[4]};
  }

  wui-text {
    text-transform: capitalize;
  }

  @media (hover: hover) {
    button:hover:enabled {
      background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    }
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,T=function(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a},E=class extends l{constructor(){super(...arguments),this.logo=`google`,this.name=`Continue with google`,this.disabled=!1}render(){return u`
      <button ?disabled=${this.disabled} tabindex=${g(this.tabIdx)}>
        <wui-flex gap="2" alignItems="center">
          <wui-image ?boxed=${!0} logo=${this.logo}></wui-image>
          <wui-text variant="lg-regular" color="primary">${this.name}</wui-text>
        </wui-flex>
        <wui-icon name="chevronRight" size="lg" color="default"></wui-icon>
      </button>
    `}};E.styles=[p,d,w],T([h()],E.prototype,`logo`,void 0),T([h()],E.prototype,`name`,void 0),T([h()],E.prototype,`tabIdx`,void 0),T([h({type:Boolean})],E.prototype,`disabled`,void 0),E=T([m(`wui-list-social`)],E);export{b as t};