// ========================
// 金額入力テンキーUI（計算機機能付き）
// ui/numpad.js
// 役割：金額入力を効率化するための専用テンキーインターフェース
// 機能：
// - 数字入力・四則演算・計算実行
// - リアルタイムでの表示更新（数値と計算式）
// - 隠しフィールド（#amount）との自動同期
// - 重複初期化の防止機能
// 
// 必要なDOM要素：
// - #expense-form: フォーム要素
// - #amount: 隠しフィールド（実際にサーバーに送信される値）
// - #amount-display: 金額表示エリア（フォーマット済み）
// - #amount-formula: 計算式表示エリア
// - .js-numpad: テンキー本体
// ========================

function ensureNumpadStyles() {
  if (document.getElementById("numpad-style")) return;
  const css = `
/* === テンキー + 金額表示 === */
.c-amount-displaybox{font-variant-numeric:tabular-nums;text-align:right;padding:12px;margin-bottom:12px;border:1px solid #ccc;border-radius:var(--radius-l,12px);background:#fff}
.c-amount-formula{font-size:var(--fz-18,18px);color:#555;min-height:24px}
.c-amount-value{margin-top:2px;font-size:var(--fz-36,36px);font-weight:700;color:#111}
.c-amount-prefix,.c-amount-suffix{font-size:var(--fz-16,16px);color:#555;margin:0 4px}
.c-numpad{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:320px}
.c-numpad-row{display:contents}
.c-key{font-size:24px;padding:18px 0;border:none;border-radius:var(--radius-l,12px);background:#e5e7eb;cursor:pointer;transition:background-color .15s ease,transform .05s ease;user-select:none}
.c-key:active{background:#d1d5db;transform:translateY(1px)}
.c-key.c-key--warn{background:var(--c-danger,#ef4444);color:#fff}
.c-key.c-key--action{background:var(--c-primary,#3b82f6);color:#fff}
.c-key.c-key--wide{grid-column:span 2}
  `;
  const style = document.createElement("style");
  style.id = "numpad-style";
  style.textContent = css;
  document.head.appendChild(style);
}

export function initAmountNumpad() {
  ensureNumpadStyles();

  const form = document.getElementById("expense-form");
  if (!form) return;

  const amountInput = form.querySelector("#amount");
  const displayEl   = form.querySelector("#amount-display");
  const formulaEl   = form.querySelector("#amount-formula");
  const keypad      = form.querySelector(".js-numpad");
  if (!amountInput || !displayEl || !formulaEl || !keypad) return;

  if (keypad.dataset.numpadBound === "1") { keypad.__numpadSync?.(); return; }
  keypad.dataset.numpadBound = "1";

  const fmt = new Intl.NumberFormat("ja-JP");
  let current = String(Math.max(0, Number(amountInput.value) || 0));
  let tokens = [];
  let result = null;
  let finished = false;

  const toPosInt = (n) => { n = Math.trunc(Number(n) || 0); return n < 0 ? 0 : n; };

  function calc(ts){
    if (!ts.length) return 0;
    let acc = toPosInt(ts[0]);
    for (let i=1;i<ts.length;i+=2){
      const op = ts[i], b = toPosInt(ts[i+1]);
      if (op === "+") acc += b;
      else if (op === "-") acc = Math.max(0, acc - b);
      else if (op === "×") acc *= b;
      else if (op === "÷") acc = b === 0 ? 0 : Math.floor(acc / b);
    }
    return acc;
  }

  function syncDom(){
    const n = toPosInt(current);
    displayEl.textContent = fmt.format(n);
    formulaEl.textContent = tokens.join(" ");
    amountInput.value = String(n);
  }

  function resetIfFinished(){
    if (finished){ tokens=[]; current="0"; finished=false; }
  }

  function syncFromInput(){
    current = String(Math.max(0, Number(amountInput.value) || 0));
    tokens=[]; finished=false; result=null; syncDom();
  }
  keypad.__numpadSync = syncFromInput;

  keypad.querySelectorAll(".js-key").forEach((btn)=>{
    btn.addEventListener("click", ()=>{
      const action = btn.dataset.action;
      const op = btn.dataset.op;

      if (!action && !op){
        const d = btn.textContent.trim();
        resetIfFinished();
        current = current === "0" ? d : current + d;
        syncDom(); return;
      }

      if (action === "clear"){
        current="0"; tokens=[]; finished=false; result=null; syncDom(); return;
      }

      if (action === "back"){
        resetIfFinished();
        current = current.slice(0,-1) || "0";
        syncDom(); return;
      }

      if (op){
        if (finished){ tokens=[result]; finished=false; }
        else { tokens.push(toPosInt(current)); }
        tokens.push(op);
        current="0";
        syncDom(); return;
      }

      if (action === "equal"){
        tokens.push(toPosInt(current));
        result = calc(tokens);
        formulaEl.textContent = tokens.join(" ") + " =";
        current = String(result);
        finished = true;
        tokens = [];
        syncDom(); return;
      }

      if (action === "ok"){
        (form.querySelector("#memo") || form.querySelector("[type='submit']"))?.focus();
        return;
      }
    });
  });

  syncDom();
  amountInput.addEventListener("focus", (e)=>e.target.blur?.());
}