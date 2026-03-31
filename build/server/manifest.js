const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png","og-card.svg"]),
	mimeTypes: {".png":"image/png",".svg":"image/svg+xml",".woff2":"font/woff2",".woff":"font/woff"},
	_: {
		client: {start:"_app/immutable/entry/start.DjBH8AcG.js",app:"_app/immutable/entry/app.LC_T_z6y.js",imports:["_app/immutable/entry/start.DjBH8AcG.js","_app/immutable/chunks/CserSlnI.js","_app/immutable/chunks/Co55RbUi.js","_app/immutable/chunks/BO73DafF.js","_app/immutable/entry/app.LC_T_z6y.js","_app/immutable/chunks/DXb0ZbaM.js","_app/immutable/chunks/Co55RbUi.js","_app/immutable/chunks/BO73DafF.js","_app/immutable/chunks/CT0T0Gak.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-Nzfa5AJV.js')),
			__memo(() => import('./chunks/1-7iJSYbpS.js')),
			__memo(() => import('./chunks/2-P9NuwIN0.js')),
			__memo(() => import('./chunks/3-uWm3Ax8K.js')),
			__memo(() => import('./chunks/4-7ekqwJzY.js')),
			__memo(() => import('./chunks/5-BIsp7s6w.js')),
			__memo(() => import('./chunks/6-DRRMroz_.js')),
			__memo(() => import('./chunks/7-BNKGaG0K.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/kefine/orders/create",
				pattern: /^\/api\/kefine\/orders\/create\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CaCXIHLw.js'))
			},
			{
				id: "/api/kefine/orders/status/[id]",
				pattern: /^\/api\/kefine\/orders\/status\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CfYP9zvM.js'))
			},
			{
				id: "/api/kefine/payment-config",
				pattern: /^\/api\/kefine\/payment-config\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BZPUzxSw.js'))
			},
			{
				id: "/create",
				pattern: /^\/create\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CjKxVad3.js'))
			},
			{
				id: "/legal-information",
				pattern: /^\/legal-information\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/order/[id]",
				pattern: /^\/order\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/passkeys/authenticate/finish",
				pattern: /^\/passkeys\/authenticate\/finish\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DeE9vs4f.js'))
			},
			{
				id: "/passkeys/authenticate/start",
				pattern: /^\/passkeys\/authenticate\/start\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-GPRI50Pk.js'))
			},
			{
				id: "/passkeys/register/finish",
				pattern: /^\/passkeys\/register\/finish\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CsXG12Zy.js'))
			},
			{
				id: "/passkeys/register/start",
				pattern: /^\/passkeys\/register\/start\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CviMef-m.js'))
			},
			{
				id: "/payment/config",
				pattern: /^\/payment\/config\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-l4DpFIMN.js'))
			},
			{
				id: "/payment/[id]",
				pattern: /^\/payment\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BpNnsrSI.js'))
			},
			{
				id: "/payment/[id]/promo",
				pattern: /^\/payment\/([^/]+?)\/promo\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CyTTwiRo.js'))
			},
			{
				id: "/pay/[id]",
				pattern: /^\/pay\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BnAIKbQi.js'))
			},
			{
				id: "/privacy",
				pattern: /^\/privacy\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/refund-policy",
				pattern: /^\/refund-policy\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-phidm4ty.js'))
			},
			{
				id: "/robots.txt",
				pattern: /^\/robots\.txt\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CLh4V7w8.js'))
			},
			{
				id: "/sitemap.xml",
				pattern: /^\/sitemap\.xml\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CulTIQoI.js'))
			},
			{
				id: "/status",
				pattern: /^\/status\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D36-9-ER.js'))
			},
			{
				id: "/status/[id]",
				pattern: /^\/status\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DGsbOC8-.js'))
			},
			{
				id: "/task/[id]",
				pattern: /^\/task\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/terms",
				pattern: /^\/terms\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {"_app/immutable/assets/manrope-cyrillic-400-normal.BMzJvInZ.woff2":7840,"_app/immutable/assets/manrope-cyrillic-400-normal.Dvx59UGC.woff":10032,"_app/immutable/assets/manrope-greek-400-normal.CM4qok81.woff2":5280,"_app/immutable/assets/manrope-greek-400-normal.DuX9RsAR.woff":6772,"_app/immutable/assets/manrope-vietnamese-400-normal.DHb3EETF.woff2":4464,"_app/immutable/assets/manrope-vietnamese-400-normal.D7E_mLGF.woff":6108,"_app/immutable/assets/manrope-latin-ext-400-normal.CMDvPJRp.woff2":8292,"_app/immutable/assets/manrope-latin-ext-400-normal.C-X6QNXX.woff":11316,"_app/immutable/assets/manrope-latin-400-normal.PaqtzbVb.woff2":14108,"_app/immutable/assets/manrope-latin-400-normal.8tf8FM3T.woff":18292,"_app/immutable/assets/manrope-cyrillic-500-normal.B1OEZity.woff2":7872,"_app/immutable/assets/manrope-cyrillic-500-normal.CNwnNrRC.woff":10012,"_app/immutable/assets/manrope-greek-500-normal.GeMIHyWm.woff2":5252,"_app/immutable/assets/manrope-greek-500-normal.DyxYGEtJ.woff":6764,"_app/immutable/assets/manrope-vietnamese-500-normal.DCXiE_xi.woff2":4320,"_app/immutable/assets/manrope-vietnamese-500-normal.DaZ8i3XM.woff":6060,"_app/immutable/assets/manrope-latin-ext-500-normal.dm74KBQw.woff2":8192,"_app/immutable/assets/manrope-latin-ext-500-normal.EtoS1VaI.woff":11248,"_app/immutable/assets/manrope-latin-500-normal.BYYD-dBL.woff2":14044,"_app/immutable/assets/manrope-latin-500-normal.DMZssgOp.woff":18240,"_app/immutable/assets/manrope-cyrillic-600-normal.DvRl3Mj-.woff2":7872,"_app/immutable/assets/manrope-cyrillic-600-normal.It4mZcQk.woff":10060,"_app/immutable/assets/manrope-greek-600-normal.BoRV6lzK.woff2":5232,"_app/immutable/assets/manrope-greek-600-normal.CF2i9ZRY.woff":6740,"_app/immutable/assets/manrope-vietnamese-600-normal.C1J5PCl_.woff2":4468,"_app/immutable/assets/manrope-vietnamese-600-normal.lA7a_7Ok.woff":6140,"_app/immutable/assets/manrope-latin-ext-600-normal._gBojHdJ.woff2":8304,"_app/immutable/assets/manrope-latin-ext-600-normal.u5Pl7hTU.woff":11248,"_app/immutable/assets/manrope-latin-600-normal.4f0koTD-.woff2":14172,"_app/immutable/assets/manrope-latin-600-normal.BqgrALkZ.woff":18384,"_app/immutable/assets/manrope-cyrillic-700-normal.Dw_fZAg2.woff2":7852,"_app/immutable/assets/manrope-cyrillic-700-normal.7JNVKxyl.woff":10004,"_app/immutable/assets/manrope-greek-700-normal.CHUG9PD8.woff2":5236,"_app/immutable/assets/manrope-greek-700-normal.DyfsrCpP.woff":6744,"_app/immutable/assets/manrope-vietnamese-700-normal.CUqMx5-1.woff2":4552,"_app/immutable/assets/manrope-vietnamese-700-normal.pt65Fn2Z.woff":6364,"_app/immutable/assets/manrope-latin-ext-700-normal.DYOwVNan.woff2":8276,"_app/immutable/assets/manrope-latin-ext-700-normal.eVCcYqtJ.woff":11352,"_app/immutable/assets/manrope-latin-700-normal.BZp_XxE4.woff2":14212,"_app/immutable/assets/manrope-latin-700-normal.DGRFkw-m.woff":18412}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
