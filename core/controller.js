// ========================
// コントローラー統合版
// core/controller.js
// 目的：アプリの共通初期化と清算機能の初期化を提供する
// 役割：各機能モジュールの初期化関数をまとめてエクスポートする
// ======================== 

// ---- Imports (State / Router) ----
import { currentUser, setCurrentUser, editingId, setEditingId } from "./state.js";
import { show } from "./router.js";

// ---- Imports (UI Components) ----
import { toast } from "../ui/toast.js";
import { initAmountNumpad } from "../ui/numpad.js";

// ---- Imports (Views) ----
import { renderExpensesTable } from "../ui/expenses-view.js";
import {
  renderSettlementHistory,
  renderClearanceSummaryAll,
  renderClearanceActions,
} from "../ui/settlement-view.js";

// ---- Imports (Services) ----
import { addExpense, editExpense, deleteExpense } from "../services/expenses-service.js";
import {
  listAllSettlements,
  requestSettlement,
  approveSettlement,
  rejectSettlement,
} from "../services/settlements-service.js";

// ---- Utils ----
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const on = (el, ev, fn) => el && el.addEventListener(ev, fn);



// ========================
// 外部公開関数：他のモジュールから呼び出される関数
// ========================

export async function refreshHome() {
  await renderExpensesTable();          // 支出一覧を再描画
  await renderSettlementHistory();      // 清算履歴を再描画
  await renderClearanceSummaryAll();    // 清算サマリーを更新
}

export async function initCommon() {
  // 各機能の初期化
  bindUserSwitcher();               // ユーザー切替機能の設定
  bindRoutes();                     // 画面遷移ボタンの設定
  bindEntryForm();                  // 支出入力フォームの設定
  bindEntryShortcuts();             // 入力フォームのショートカット機能設定

  // 詳細画面表示用のグローバル関数を設定
  exposeDetailHook();                // 詳細画面表示機能の設定

  // 精算機能の初期化
  bindClearanceButtons();            // 清算関連のボタンの動作を設定
  bindClearanceRouteInit();          // 清算画面への遷移時の処理を設定

  // アプリの初期表示
  show("home");                          // ホーム画面を表示
  await refreshHome();                   // ホーム画面の内容を更新
}

// ========================
// 内部関数：このファイル内でのみ使用されるプライベート関数群
// ========================

function bindUserSwitcher() {
  const userSelect = $("#current-user") || $(".js-current-user");
  if (!userSelect) return;

  ["Aさん", "Bさん"].forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u;
    opt.textContent = u;
    userSelect.appendChild(opt);
  });

  userSelect.value = currentUser;

  on(userSelect, "change", async () => {
    setCurrentUser(userSelect.value);
    const payerInput = $("#payer");
    if (payerInput) payerInput.value = userSelect.value;
    await renderClearanceSummaryAll();
    await refreshHome();
  });
}

function bindRoutes() {
  $$(".js-route").forEach((btn) => {
    on(btn, "click", async () => {
      const view = btn.getAttribute("data-view");
      show(view);

      if (view === "home") {
        await refreshHome();

      } else if (view === "entry") {
        setEditingId(null);
        resetExpenseForm();

        const payerInput = $("#payer");
        if (payerInput) payerInput.value = currentUser;

        const dateEl = document.getElementById("date");
        if (dateEl && !dateEl.value) {
          dateEl.value = new Date().toISOString().slice(0, 10);
        }

        initAmountNumpad();
      }
    });
  });
}

function bindEntryForm() {
  const form = $("#expense-form");

  const payerInputAtInit = $("#payer");
  if (payerInputAtInit) payerInputAtInit.value = currentUser;

  on(form, "submit", async (e) => {
    e.preventDefault();

    const payload = {
      id: editingId || undefined,
      payer: $("#payer").value,
      amount: Number($("#amount").value),
      date: $("#date").value,
      category: $("#category").value,
      memo: $("#memo").value,
    };

    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      toast.error("金額を入力してください");
      document.querySelector(".js-numpad .js-key[data-key]")?.focus()
        || document.getElementById("amount-display")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!payload.date) { toast.error("日付を入力してください"); $("#date")?.focus(); return; }
    if (!payload.category) { toast.error("カテゴリを選択してください"); $(".js-cat")?.focus(); return; }

    try {
      if (editingId) {
        await editExpense(payload);
        setEditingId(null);
      } else {
        await addExpense(payload);
      }

      toast.success("保存しました");

      resetExpenseForm();
      $("#payer").value = currentUser;

      show("home");
      await renderClearanceSummaryAll();
      await refreshHome();

    } catch (err) {
      console.warn(err);
      toast.error(err?.message || "保存に失敗しました");
    }
  });

  // 詳細→編集
  window.__editExpense = async (exp) => {
    setEditingId(exp.id);
    $("#payer").value = exp.payer;
    $("#amount").value = exp.amount;
    $("#date").value = exp.date;
    $("#category").value = exp.category;
    $("#memo").value = exp.memo;

    document.querySelectorAll(".js-cat").forEach((c) => {
      c.classList.toggle("is-active", c.getAttribute("data-cat") === exp.category);
    });

    show("entry");
    initAmountNumpad();
    document.querySelector(".js-numpad")?.__numpadSync?.();
  };

  // 詳細→削除
  window.__deleteExpense = async (expId) => {
    await deleteExpense(expId);
    await renderClearanceSummaryAll();
    await refreshHome();
    toast.success("削除しました");
  };
}

function bindEntryShortcuts() {
  const btnToday = $(".js-date-today");
  const btnYesterday = $(".js-date-yesterday");
  const dateInput = $("#date");

  on(btnToday, "click", () => {
    if (!dateInput) return;
    const d = new Date();
    dateInput.value = d.toISOString().slice(0, 10);
  });

  on(btnYesterday, "click", () => {
    if (!dateInput) return;
    const d = new Date();
    d.setDate(d.getDate() - 1);
    dateInput.value = d.toISOString().slice(0, 10);
  });

  const categoryHidden = $("#category");
  $$(".js-cat").forEach((chip) => {
    on(chip, "click", () => {
      $$(".js-cat").forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      if (categoryHidden) categoryHidden.value = chip.getAttribute("data-cat") || "";
    });
  });
}

function exposeDetailHook() {
  if (typeof window.__showExpenseDetail === "function") return;

  const q = (s, r = document) => r.querySelector(s);
  const yen = (n) => new Intl.NumberFormat("ja-JP").format(Number(n || 0)) + "円";

  window.__showExpenseDetail = (exp) => {
    q(".js-detail-date").textContent      = exp.date ?? "-";
    q(".js-detail-payer").textContent     = exp.payer ?? "-";
    q(".js-detail-category2").textContent = exp.category ?? "-";
    q(".js-detail-amount2").textContent   = yen(exp.amount);
    q(".js-detail-memo").textContent      = exp.memo ?? "-";
    q(".js-detail-createdBy").textContent = exp.createdBy ?? "-";
    q(".js-detail-updated").textContent   = exp.lastUpdated
      ? new Date(exp.lastUpdated).toLocaleString()
      : "-";

    show("detail");

    const editBtn = q(".js-detail-edit");
    const delBtn  = q(".js-detail-delete");

    if (editBtn) editBtn.onclick = () => window.__editExpense?.(exp);
    if (delBtn)  delBtn.onclick  = async () => {
      await window.__deleteExpense?.(exp.id);
      show("home");
      await refreshHome();
    };
  };
}

function primeFormDefaults(form) {
  if (!form) return;
  for (const el of form.elements) {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.defaultValue = el.value;
      if (el.type === "checkbox" || el.type === "radio") el.defaultChecked = el.checked;
    } else if (el instanceof HTMLSelectElement) {
      for (const opt of el.options) opt.defaultSelected = opt.selected;
    }
  }
}

function resetExpenseForm(opts = {}) {
  const { keepDate = false } = opts;
  const form = document.getElementById("expense-form");
  if (!form) return;

  form.reset();

  const payer = form.querySelector("#payer");
  if (payer) payer.value = (currentUser ?? payer.value ?? "");

  const amountHidden  = form.querySelector("#amount");
  const amountFormula = form.querySelector("#amount-formula");
  const amountDisplay = form.querySelector("#amount-display");
  if (amountHidden)  amountHidden.value = "0";
  if (amountFormula) amountFormula.textContent = "";
  if (amountDisplay) amountDisplay.textContent = "0";

  const catHidden = form.querySelector("#category");
  if (catHidden) catHidden.value = "";
  form.querySelectorAll(".js-cat.is-active,[aria-pressed='true'],[data-selected]")
    .forEach(chip => {
      chip.classList.remove("is-active");
      chip.removeAttribute("aria-pressed");
      chip.removeAttribute("data-selected");
    });

  form.querySelectorAll(".c-form__error").forEach(el => el.hidden = true);
  const loading = form.querySelector(".js-form-loading"); if (loading) loading.hidden = true;
  const err     = form.querySelector(".js-form-error");  if (err)     err.hidden = true;

  if (!keepDate) {
    const date = form.querySelector("#date");
    if (date) {
      date.value = "";
      date.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  form.dispatchEvent(new CustomEvent("form:reset", { bubbles: true }));
  primeFormDefaults(form);
}

function bindClearanceRouteInit() {
  document.querySelectorAll(".js-route").forEach((btn) => {
    on(btn, "click", async () => {
      if (btn.getAttribute("data-view") !== "clearance") return;
      await renderClearanceSummaryAll();
      await renderClearanceActions();
      await renderSettlementHistory();
    });
  });
}

function bindClearanceButtons() {
  const applyBtn   = $(".js-clearance-apply");
  const cancelBtn  = $(".js-clearance-cancel");
  const approveBtn = $(".js-clearance-approve2");
  const rejectBtn  = $(".js-clearance-reject2");

  const refreshAll = async () => {
    await renderClearanceSummaryAll();
    await renderClearanceActions();
    await renderSettlementHistory();
  };

  const getPending = async () => {
    const list = await listAllSettlements();
    return list.find(s => s.status === "申請中");
  };

  on(applyBtn, "click", async () => {
    try {
      const who = ($("#current-user") || document.querySelector(".js-current-user"))?.value || currentUser;
      await requestSettlement(who);
      await refreshAll();
      toast.success("清算を申請しました");
      show("home");
    } catch (e) {
      console.warn(e);
      toast.error(e.message);
    }
  });

  on(cancelBtn, "click", async () => {
    try {
      const p = await getPending();
      if (p) {
        await rejectSettlement(p.id);
        await refreshAll();
      }
      toast.warn("清算を取り消しました");
      show("home");
    } catch (e) {
      console.warn(e);
      toast.error("エラーが発生しました");
    }
  });

  on(approveBtn, "click", async () => {
    try {
      const p = await getPending();
      if (p) {
        await approveSettlement(p.id);
        await refreshAll();
      }
      toast.success("清算しました");
      show("home");
    } catch (e) {
      console.warn(e);
    }
  });

  on(rejectBtn, "click", async () => {
    try {
      const p = await getPending();
      if (p) {
        await rejectSettlement(p.id);
        await refreshAll();
      }
      toast.warn("清算を取り消しました");
      show("home");
    } catch (e) {
      console.warn(e);
    }
  });

  window.__approveSettlement = async (id) => { await approveSettlement(id); await refreshAll(); };
  window.__rejectSettlement  = async (id) => { await rejectSettlement(id);  await refreshAll(); };
}