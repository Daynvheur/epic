!function(){var t;function e(t){if(this.size=0|t,this.size<=1||0!=(this.size&this.size-1))throw new Error("FFT size must be a power of two and bigger than 1");this._csize=t<<1;for(var e=new Array(2*this.size),n=0;n<e.length;n+=2){const t=Math.PI*n/this.size;e[n]=Math.cos(t),e[n+1]=-Math.sin(t)}this.table=e;for(var r=0,o=1;this.size>o;o<<=1)r++;this._width=r%2==0?r-1:r,this._bitrev=new Array(1<<this._width);for(var i=0;i<this._bitrev.length;i++){this._bitrev[i]=0;for(var a=0;a<this._width;a+=2){var s=this._width-a-2;this._bitrev[i]|=(i>>>a&3)<<s}}this._out=null,this._data=null,this._inv=0}function n(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){if("undefined"==typeof Symbol||!(Symbol.iterator in Object(t)))return;var n=[],r=!0,o=!1,i=void 0;try{for(var a,s=t[Symbol.iterator]();!(r=(a=s.next()).done)&&(n.push(a.value),!e||n.length!==e);r=!0);}catch(t){o=!0,i=t}finally{try{r||null==s.return||s.return()}finally{if(o)throw i}}return n}(t,e)||function(t,e){if(!t)return;if("string"==typeof t)return r(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);"Object"===n&&t.constructor&&(n=t.constructor.name);if("Map"===n||"Set"===n)return Array.from(t);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return r(t,e)}(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function r(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=new Array(e);n<e;n++)r[n]=t[n];return r}t=e,e.prototype.fromComplexArray=function(t,e){for(var n=e||new Array(t.length>>>1),r=0;r<t.length;r+=2)n[r>>>1]=t[r];return n},e.prototype.createComplexArray=function(){const t=new Array(this._csize);for(var e=0;e<t.length;e++)t[e]=0;return t},e.prototype.toComplexArray=function(t,e){for(var n=e||this.createComplexArray(),r=0;r<n.length;r+=2)n[r]=t[r>>>1],n[r+1]=0;return n},e.prototype.completeSpectrum=function(t){for(var e=this._csize,n=e>>>1,r=2;r<n;r+=2)t[e-r]=t[r],t[e-r+1]=-t[r+1]},e.prototype.transform=function(t,e){if(t===e)throw new Error("Input and output buffers must be different");this._out=t,this._data=e,this._inv=0,this._transform4(),this._out=null,this._data=null},e.prototype.realTransform=function(t,e){if(t===e)throw new Error("Input and output buffers must be different");this._out=t,this._data=e,this._inv=0,this._realTransform4(),this._out=null,this._data=null},e.prototype.inverseTransform=function(t,e){if(t===e)throw new Error("Input and output buffers must be different");this._out=t,this._data=e,this._inv=1,this._transform4();for(var n=0;n<t.length;n++)t[n]/=this.size;this._out=null,this._data=null},e.prototype._transform4=function(){var t,e,n=this._out,r=this._csize,o=1<<this._width,i=r/o<<1,a=this._bitrev;if(4===i)for(t=0,e=0;t<r;t+=i,e++){const n=a[e];this._singleTransform2(t,n,o)}else for(t=0,e=0;t<r;t+=i,e++){const n=a[e];this._singleTransform4(t,n,o)}var s=this._inv?-1:1,h=this.table;for(o>>=2;o>=2;o>>=2){var u=(i=r/o<<1)>>>2;for(t=0;t<r;t+=i)for(var l=t+u,c=t,f=0;c<l;c+=2,f+=o){const t=c,e=t+u,r=e+u,o=r+u,i=n[t],a=n[t+1],l=n[e],v=n[e+1],m=n[r],d=n[r+1],p=n[o],g=n[o+1],y=i,_=a,w=h[f],b=s*h[f+1],x=l*w-v*b,k=l*b+v*w,A=h[2*f],M=s*h[2*f+1],T=m*A-d*M,I=m*M+d*A,S=h[3*f],z=s*h[3*f+1],P=p*S-g*z,E=p*z+g*S,C=y+T,N=_+I,R=y-T,B=_-I,q=x+P,L=k+E,j=s*(x-P),D=s*(k-E),O=C+q,F=N+L,H=C-q,U=N-L,W=R+D,X=B-j,Y=R-D,$=B+j;n[t]=O,n[t+1]=F,n[e]=W,n[e+1]=X,n[r]=H,n[r+1]=U,n[o]=Y,n[o+1]=$}}},e.prototype._singleTransform2=function(t,e,n){const r=this._out,o=this._data,i=o[e],a=o[e+1],s=o[e+n],h=o[e+n+1],u=i+s,l=a+h,c=i-s,f=a-h;r[t]=u,r[t+1]=l,r[t+2]=c,r[t+3]=f},e.prototype._singleTransform4=function(t,e,n){const r=this._out,o=this._data,i=this._inv?-1:1,a=2*n,s=3*n,h=o[e],u=o[e+1],l=o[e+n],c=o[e+n+1],f=o[e+a],v=o[e+a+1],m=o[e+s],d=o[e+s+1],p=h+f,g=u+v,y=h-f,_=u-v,w=l+m,b=c+d,x=i*(l-m),k=i*(c-d),A=p+w,M=g+b,T=y+k,I=_-x,S=p-w,z=g-b,P=y-k,E=_+x;r[t]=A,r[t+1]=M,r[t+2]=T,r[t+3]=I,r[t+4]=S,r[t+5]=z,r[t+6]=P,r[t+7]=E},e.prototype._realTransform4=function(){var t,e,n=this._out,r=this._csize,o=1<<this._width,i=r/o<<1,a=this._bitrev;if(4===i)for(t=0,e=0;t<r;t+=i,e++){const n=a[e];this._singleRealTransform2(t,n>>>1,o>>>1)}else for(t=0,e=0;t<r;t+=i,e++){const n=a[e];this._singleRealTransform4(t,n>>>1,o>>>1)}var s=this._inv?-1:1,h=this.table;for(o>>=2;o>=2;o>>=2){var u=(i=r/o<<1)>>>1,l=u>>>1,c=l>>>1;for(t=0;t<r;t+=i)for(var f=0,v=0;f<=c;f+=2,v+=o){var m=t+f,d=m+l,p=d+l,g=p+l,y=n[m],_=n[m+1],w=n[d],b=n[d+1],x=n[p],k=n[p+1],A=n[g],M=n[g+1],T=y,I=_,S=h[v],z=s*h[v+1],P=w*S-b*z,E=w*z+b*S,C=h[2*v],N=s*h[2*v+1],R=x*C-k*N,B=x*N+k*C,q=h[3*v],L=s*h[3*v+1],j=A*q-M*L,D=A*L+M*q,O=T+R,F=I+B,H=T-R,U=I-B,W=P+j,X=E+D,Y=s*(P-j),$=s*(E-D),G=O+W,J=F+X,K=H+$,Q=U-Y;if(n[m]=G,n[m+1]=J,n[d]=K,n[d+1]=Q,0!==f){if(f!==c){var V=H+-s*$,Z=-U+-s*Y,tt=O+-s*W,et=-F- -s*X,nt=t+l-f,rt=t+u-f;n[nt]=V,n[nt+1]=Z,n[rt]=tt,n[rt+1]=et}}else{var ot=O-W,it=F-X;n[p]=ot,n[p+1]=it}}}},e.prototype._singleRealTransform2=function(t,e,n){const r=this._out,o=this._data,i=o[e],a=o[e+n],s=i+a,h=i-a;r[t]=s,r[t+1]=0,r[t+2]=h,r[t+3]=0},e.prototype._singleRealTransform4=function(t,e,n){const r=this._out,o=this._data,i=this._inv?-1:1,a=2*n,s=3*n,h=o[e],u=o[e+n],l=o[e+a],c=o[e+s],f=h+l,v=h-l,m=u+c,d=i*(u-c),p=f+m,g=v,y=-d,_=f-m,w=v,b=d;r[t]=p,r[t+1]=0,r[t+2]=g,r[t+3]=y,r[t+4]=_,r[t+5]=0,r[t+6]=w,r[t+7]=b};var o,i,a,s=document.getElementById("canvas"),h=s.getContext("2d"),u=new Array,l=0,c=new Path2D,f=4,v=new Array,m=new Array,d=0,p=0,g=!1,y=!1,_=!0,w=new Array,b=document.getElementById("parameter-slider");b.oninput=function(){d=b.valueAsNumber,R()};var x=document.getElementById("complexity-number");x.oninput=function(){p=x.valueAsNumber,R()};var k=document.getElementById("complexity-circles-check");function A(){s.width=window.devicePixelRatio*s.clientWidth,s.height=window.devicePixelRatio*s.clientHeight}k.oninput=function(){g=k.checked,R()};var M,T,I=(M=t)&&M.__esModule?M.default:M;function S(){u.splice(0,u.length),l=0,c=new Path2D,v.splice(0,v.length)}function z(t,e){return Math.sqrt(t*t+e*e)}function P(t,e,n){return t+(e-t)*n}function E(t,e){var n=!(arguments.length>2&&void 0!==arguments[2])||arguments[2];if(0===u.length)u.push({x:t,y:e,segmentLength:0});else{var r=u[Math.max(0,u.length-2)],s=z(t-r.x,e-r.y);l+=s;var h={x:t,y:e,segmentLength:s};u.splice(u.length-1,0,h);var f=u[u.length-1];f.segmentLength=z(f.x-t,f.y-e)}c.lineTo(t,e),l>0?(C(),o.transform(a,i),N()):v.splice(0,v.length),n&&R()}function C(){for(var t=u[u.length-1],e=l+t.segmentLength,n=0,r=t,o=0,a=0;a<u.length;a++){var s=u[a];n+=s.segmentLength;for(var h=Math.round(f*n/e),c=h-o+1,v=o;v<h;v++){var m=(v-o)/c;i[2*v]=P(r.x,s.x,m),i[2*v+1]=P(r.y,s.y,m)}r=s,o=h}}function N(){v.splice(0,v.length);for(var t=0;t<f;t++){var e=a[2*t],n=a[2*t+1];v.push({frequency:t<f/2?t:t-f,magnitude:z(e,n)/f,phase:Math.atan2(n,e)})}v.sort((function(t,e){return e.magnitude-t.magnitude}))}function R(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:p,e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:d;h.setTransform(window.devicePixelRatio,0,0,window.devicePixelRatio,0,0),h.clearRect(0,0,s.clientWidth,s.clientHeight);var n=new Path2D(c);if(n.closePath(),h.strokeStyle="black",h.stroke(n),v.length>0){var r=Math.min(v.length,t<=0?v.length:t+1),o=2*Math.PI,i=e*o/f,a=0,u=0;if(g){h.beginPath();for(var l=0;l<r;l++){var y=v[l],_=i*y.frequency+y.phase,w=a+y.magnitude*Math.cos(_),b=u+y.magnitude*Math.sin(_);if(l>=1){var x=Math.sqrt(Math.pow(w-a,2)+Math.pow(b-u,2));h.moveTo(a,u),h.arc(a,u,x,0,o)}else m.splice(0,m.length);m.push({x:w,y:b}),a=w,u=b}h.strokeStyle="burlywood",h.stroke(),h.beginPath(),h.moveTo(m[0].x,m[0].y);for(var k=1;k<m.length;k++)h.lineTo(m[k].x,m[k].y);h.strokeStyle="red",h.stroke(),m.splice(0,m.length)}else h.beginPath(),M(r,i),h.strokeStyle="red",h.stroke();if(t>0){h.beginPath();for(var A=0;A<f;A++)T(r,A*o/f);T(r,0),h.strokeStyle="green",h.stroke()}}function M(t,e){for(var n=0,r=0,o=0;o<t;o++){var i=v[o],a=e*i.frequency+i.phase;n+=i.magnitude*Math.cos(a),r+=i.magnitude*Math.sin(a),h.lineTo(n,r)}}function T(t,e){for(var n=0,r=0,o=0;o<t;o++){var i=v[o],a=e*i.frequency+i.phase;n+=i.magnitude*Math.cos(a),r+=i.magnitude*Math.sin(a)}h.lineTo(n,r)}}window.addEventListener("resize",(function(){A(),R()})),A(),null===(T=window.location.search)||void 0===T||T.substr(1).split("&").forEach((function(t){switch(t){case"circles":k.checked=!0;break;case"autofft":_=!0;break;default:var e=n(t.split("="),2),r=e[0],o=e[1];if(null!==o){var i=o&&decodeURIComponent(o);switch(r){case"pt":var a=n(i.split(";"),2),s=a[0],h=a[1];null!==s&&null!==h&&w.push({x:Number(s),y:Number(h)});break;case"range":d=Number(i);break;case"circles":k.checked=Boolean(Number(i));break;case"complexity":p=Number(i);break;case"fftsize":_=!1,f=Number(i);break;case"autofft":_=Boolean(Number(i))}}}})),function t(){var e=f-1,n=Math.min(d,e),r=Math.min(p,e);g=k.checked,o=new I(f),i=o.createComplexArray(),a=o.createComplexArray(),S(),w.forEach((function(t){return E(t.x,t.y)}));var s=window.performance.now();R(r,n);var h=window.performance.now();_&&2*(h-s)<25&&f<4096?(f*=2,t()):(b.max=e.toString(),d=n,b.value=d.toString(),x.max=e.toString(),p=r,x.value=p.toString())}(),s.onpointerdown=function(t){0===t.button&&(y=!0,s.setPointerCapture(t.pointerId),E(t.offsetX,t.offsetY))},s.ontouchstart=s.ontouchmove=function(t){1===t.touches.length&&t.preventDefault()},s.onpointermove=function(t){y&&E(t.offsetX,t.offsetY)},s.onpointerup=function(t){y&&(y=!1,s.releasePointerCapture(t.pointerId))},document.getElementById("clear-button").onclick=function(){S(),R()},document.getElementById("save-button").onclick=function(){var t="";if(u.length>0)for(var e=-1;e<u.length-1;e++){var n=u[(e+u.length)%u.length];t+="&pt=".concat(n.x,";").concat(n.y)}var r=window.location.pathname+"?range="+d+"&complexity="+p+"&circles="+Number(g)+t;history.pushState(null,"",r)}}();
//# sourceMappingURL=index.19f43140.js.map