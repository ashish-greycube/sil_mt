frappe.ui.form.on('Material Request', {
    validate: function (frm) {
        cur_frm.cscript.calculate_taxes_and_totals()
    },
    schedule_date: function (frm) {
        var schedule_date = frm.doc.schedule_date;
        var me = this;
        cur_frm.cscript.set_dynamic_labels();
        var company_currency = cur_frm.cscript.get_company_currency();
        if (frm.doc.currency_cf && frm.doc.currency_cf !== company_currency && schedule_date) {
            cur_frm.cscript.get_exchange_rate(schedule_date, frm.doc.currency_cf, company_currency,
                function (exchange_rate) {
                    if (exchange_rate != frm.doc.conversion_rate_cf) {
                        frm.set_value("conversion_rate_cf", exchange_rate);
                    }
                });
        } else {
            frm.trigger('conversion_rate_cf');
        }
    },
    currency_cf: function (frm) {
        var schedule_date = frm.doc.schedule_date;
        var me = this;
        cur_frm.cscript.set_dynamic_labels();
        var company_currency = cur_frm.cscript.get_company_currency();
        if (frm.doc.currency_cf && frm.doc.currency_cf !== company_currency && schedule_date) {
            cur_frm.cscript.get_exchange_rate(schedule_date, frm.doc.currency_cf, company_currency,
                function (exchange_rate) {
                    if (exchange_rate != frm.doc.conversion_rate_cf) {
                        frm.set_value("conversion_rate_cf", exchange_rate);
                    }
                });
        } else {
            frm.trigger('conversion_rate_cf');
        }
    },
    conversion_rate_cf: function (frm) {
        const me = frm;
        if (frm.doc.currency_cf === cur_frm.cscript.get_company_currency()) {
            frm.set_value("conversion_rate_cf", 1.0);
        }
        if (flt(frm.doc.conversion_rate_cf) > 0.0) {
            cur_frm.cscript.calculate_taxes_and_totals()
        }
        // Make read only if Accounts Settings doesn't allow stale rates
        frm.set_df_property("conversion_rate_cf", "read_only", erpnext.stale_rate_allowed() ? 0 : 1);
    }
});
cur_frm.cscript.calculate_taxes_and_totals = function () {
        cur_frm.doc.total_qty_cf = 0.0
        cur_frm.doc.total_cf = 0.0
        cur_frm.doc.base_total_cf = 0.0

        $.each(cur_frm.doc["items"] || [], function (i, item) {
            frappe.model.round_floats_in(item);
            cur_frm.doc.total_cf += item.amount
            cur_frm.doc.total_qty_cf += item.qty
        })
        if (flt(cur_frm.doc.conversion_rate_cf) > 0.0) {
            cur_frm.doc.base_total_cf = cur_frm.doc.total_cf * cur_frm.doc.conversion_rate_cf

        }
        frappe.model.round_floats_in(cur_frm.doc, ["total_cf", "base_total_cf"]);
    },
    cur_frm.cscript.get_company_currency = function () {
        return erpnext.get_currency(cur_frm.doc.company);
    },
    cur_frm.cscript.get_exchange_rate = function (transaction_date, from_currency, to_currency, callback) {
        console.log('exchange_rate')
        var args;
        if (["Material Request"].includes(this.frm.doctype)) {
            args = "for_buying";
        }

        if (!transaction_date || !from_currency || !to_currency) return;
        return frappe.call({
            method: "erpnext.setup.utils.get_exchange_rate",
            args: {
                transaction_date: transaction_date,
                from_currency: from_currency,
                to_currency: to_currency,
                args: args
            },
            callback: function (r) {
                callback(flt(r.message));
            }
        });
    },
    cur_frm.cscript.set_dynamic_labels = function () {
        var company_currency = cur_frm.cscript.get_company_currency();
        cur_frm.cscript.change_form_labels(company_currency);
        cur_frm.refresh_fields();
    },
    cur_frm.cscript.change_form_labels = function (company_currency) {
        cur_frm.set_currency_labels(["base_total_cf"], company_currency);
        cur_frm.set_currency_labels(["total_cf"], cur_frm.doc.currency_cf);
        cur_frm.set_df_property("conversion_rate_cf", "description", "1 " + cur_frm.doc.currency_cf +
            " = [?] " + company_currency);
        // toggle fields
        cur_frm.toggle_display(["conversion_rate_cf", "base_total_cf"], cur_frm.doc.currency_cf != company_currency);
        if (frappe.meta.get_docfield(cur_frm.doctype, "base_net_total"))
            cur_frm.toggle_display("base_net_total", (show && (cur_frm.doc.currency_cf != company_currency)));

    }