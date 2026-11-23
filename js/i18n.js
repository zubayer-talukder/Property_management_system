/* ============================================================
   Property Management System — Internationalization (i18n)
   Supports Bengali (bn) and English (en) with live reactivity
   ============================================================ */

'use strict';

const I18N = {
  bn: {
    // Topbar & Branding
    app_title: 'ভাড়া বাড়ি ম্যানেজার',
    app_subtitle: 'Property Management System',
    theme_toggle_title: 'থিম পরিবর্তন করুন (লাইট / ব্লুইশ)',
    lang_btn_text: 'English',
    lang_btn_title: 'Change to English',
    demo_data: 'নমুনা ডাটা',
    sync_btn: 'সিঙ্ক করুন',
    syncing_btn: 'সিঙ্ক হচ্ছে...',
    auto_sync_active: 'অটো-সেভ সক্রিয়',
    restore_btn: 'Restore',
    google_login: 'Google Login',
    logout_title: 'লগআউট',
    backup_demo_text: 'Demo mode — ডাটা LocalStorage-এ সংরক্ষিত। Firebase কানেক্ট করুন cloud backup-এর জন্য।',

    // Login Page
    login_heading: 'গুগল দিয়ে লগইন করুন',
    login_subheading: 'আপনার ভেরিফাইড জিমেইল / গুগল অ্যাকাউন্টের মাধ্যমে এক ক্লিকেই ওনার ড্যাশবোর্ডে প্রবেশ করুন।',
    login_btn_text: 'Google দিয়ে লগইন করুন',
    login_brand_desc: 'বাড়ি ভাড়া, বিদ্যুৎ বিল ও ভাড়াটিয়া ব্যবস্থাপনার সহজ সমাধান।',
    login_secure_badge: 'সুরক্ষিত ড্যাশবোর্ড এক্সেস',
    login_secure_notice: 'আপনার বাড়ি ও ভাড়াটিয়াদের গোপনীয়তা রক্ষার স্বার্থে জিমেইল/গুগল দিয়ে সাইন-ইন করা বাধ্যতামূলক। লগইন ছাড়া ড্যাশবোর্ড দেখা যাবে না।',
    feat_1: '<strong>নিরাপদ Google লগইন</strong> — পাসওয়ার্ড মনে রাখার ঝামেলা নেই।',
    feat_2: '<strong>বিদ্যুৎ সাব-মিটার স্বয়ংক্রিয় হিসাব</strong> — প্রতিটি রুমের নির্ভুল বিল।',
    feat_3: '<strong>ভাড়াটিয়ার পূর্ণাঙ্গ KYC</strong> — পরিবার, NID ছবি ও ইমার্জেন্সি কন্টাক্ট সংরক্ষণ।',
    feat_4: '<strong>ডিজিটাল মানি রিসিট ও WhatsApp নোটিশ</strong> — ১ ক্লিকেই ভাড়ার চালান ও মেসেজ প্রেরণ।',

    // Properties Page
    my_properties: 'আমার প্রপার্টি',
    add_property_btn: 'নতুন প্রপার্টি যুক্ত করুন',
    no_properties_msg: 'কোনো প্রপার্টি তৈরি করা হয়নি। নতুন প্রপার্টি তৈরি করুন।',
    rooms_suffix: 'টি রুম',
    tenants_suffix: 'ভাড়াটিয়া',
    due_badge: 'বকেয়া',
    confirm_delete_prop: 'আপনি কি নিশ্চিতভাবে এই প্রপার্টি মুছে ফেলতে চান?',
    property_modal_add: 'নতুন প্রপার্টি যুক্ত করুন',
    property_modal_edit: 'প্রপার্টি সম্পাদনা',
    prop_name_lbl: 'প্রপার্টির নাম',
    prop_addr_lbl: 'ঠিকানা',
    prop_owners_lbl: 'মালিকানা / ওনার নাম (কমা দিয়ে একাধিক)',
    prop_meter_no_lbl: 'মেইন বিদ্যুৎ মিটার নং (ঐচ্ছিক)',
    prop_save_btn: 'প্রপার্টি সংরক্ষণ করুন',

    // Property Detail Header & Navigator
    back_to_props: 'ফিরে যান',
    print_summary_btn: 'মাসিক সামারি প্রিন্ট',
    owner_split_btn: 'Co-Owner Split',
    add_room_btn: 'রুম যুক্ত করুন',
    add_tenant_btn: 'নতুন ভাড়াটিয়া যুক্ত করুন',
    auto_generate_btn: 'Auto-Generate বিল',
    tab_rooms: 'রুম ও বিলিং',
    tab_electricity: 'বিদ্যুৎ মিটার',

    // Dashboard Metric Cards
    metric_total_rooms: 'মোট রুম',
    metric_paid_rooms: 'পরিশোধিত রুম',
    metric_due_rooms: 'বকেয়া রুম',
    metric_due_amount: 'মোট বকেয়া',
    metric_vacant_rooms: 'খালি রুম',
    metric_expected_rent: 'মোট প্রত্যাশিত',

    // Rooms & Billing Table Headers
    th_room: 'রুম',
    th_tenant: 'ভাড়াটিয়া',
    th_phone: 'ফোন নম্বর',
    th_rent: 'মূল ভাড়া',
    th_electricity: 'বিদ্যুৎ বিল',
    th_utilities: 'ইউটিলিটি/অন্যান্য',
    th_total: 'মোট বিল',
    th_status: 'স্ট্যাটাস',
    th_actions: 'অ্যাকশন',

    // Status Badges
    status_paid: 'পরিশোধিত',
    status_partial: 'আংশিক',
    status_due: 'বকেয়া',
    status_vacant: 'খালি রুম',
    status_advance: 'অতিরিক্ত জমা',

    // Action Tooltips & Buttons
    btn_bill: 'বিল',
    btn_edit_room: 'রুম এডিট',
    btn_kyc: 'KYC প্রোফাইল',
    btn_receipt: 'মানি রিসিট',
    btn_slip: 'পেমেন্ট স্লিপ',
    no_tenant_assigned: 'ভাড়াটিয়া নেই',
    click_to_assign: 'ভাড়াটিয়া যুক্ত করুন',

    // Electricity Table Headers & Notices
    th_meter_no: 'মিটার নং',
    th_prev_reading: 'পূর্বের রিডিং',
    th_curr_reading: 'বর্তমান রিডিং',
    th_units: 'ব্যবহৃত ইউনিট',
    th_rate: 'ইউনিট প্রতি দর (৳)',
    th_elec_cost: 'বিদ্যুৎ চার্জ (৳)',
    elec_sync_notice: 'বিদ্যুৎ সাব-মিটার হিসাব স্বয়ংক্রিয়ভাবে রুমের মূল বিলের সাথে সমন্বিত থাকে।',

    // Bill Modal
    bill_modal_title: 'মাসিক বিল ও পেমেন্ট বিবরণী',
    bill_room_title: 'রুম নং',
    bill_month_title: 'মাস',
    lbl_base_rent: 'মূল বাড়ি ভাড়া',
    lbl_elec_charge: 'বিদ্যুৎ বিল (সাব-মিটার)',
    lbl_water_charge: 'পানির বিল',
    lbl_gas_charge: 'গ্যাস বিল',
    lbl_wifi_charge: 'ওয়াইফাই / ইন্টারনেট',
    lbl_other_charge: 'অন্যান্য সার্ভিস চার্জ',
    lbl_prev_balance: 'পূর্বের বকেয়া (+) / অগ্রিম (-)',
    lbl_total_bill: 'সর্বমোট বিল',
    lbl_paid_amount: 'পরিশোধিত টাকা',
    lbl_paid_date: 'পরিশোধের তারিখ',
    lbl_payment_gateway: 'পেমেন্ট গেটওয়ে (বাংলা QR)',
    lbl_remarks: 'মন্তব্য / রিমার্কস',
    btn_save_bill: 'বিল সংরক্ষণ করুন',
    btn_delete_bill: 'বিল মুছুন',
    btn_close: 'বন্ধ করুন',
    btn_cancel: 'বাতিল',
    custom_qr_active: 'এই বিলের কাস্টম ডায়নামিক QR সক্রিয়',
    custom_qr_upload_btn: 'এই বিলের জন্য CellFin / বিকাশ কিউআর ছবি আপলোড করুন',
    custom_qr_clear_btn: 'মুছুন',

    // Money Receipt & Payment Slip
    receipt_title: 'বাড়ি ভাড়ার মানি রিসিট',
    receipt_voucher_no: 'ভাউচার নং:',
    receipt_date_txt: 'তারিখ:',
    receipt_in_words: 'কথায় (In Words):',
    receipt_notes_label: 'মন্তব্য / নোট:',
    receipt_sig_tenant: 'ভাড়াটিয়ার স্বাক্ষর',
    receipt_sig_landlord: 'বাড়িওয়ালা / ম্যানেজারের স্বাক্ষর',
    ps_title: 'পেমেন্ট স্লিপ ও বাংলা QR',
    ps_payable_amount: 'প্রদেয় মোট টাকা (Payable Amount):',
    ps_acc_number: 'হিসাব / মোবাইল নম্বর:',
    ps_acc_name: 'হিসাবধারীর নাম:',
    ps_bank_name: 'ব্যাংক এর নাম:',
    ps_payment_ref: 'পেমেন্ট রেফারেন্স:',
    ps_txn_type: 'লেনদেনের ধরন:',
    ps_how_to_pay: 'কিভাবে পেমেন্ট করবেন?',
    ps_step_1: 'বিকাশ, সেলফিন বা ব্যাংক অ্যাপ ওপেন করে "কিউআর স্ক্যান" অপশনে যান।',
    ps_step_2: 'পাশের বাংলা QR স্ক্যান করুন অথবা সরাসরি নম্বরে টাকা পাঠান।',
    ps_step_3: 'টাকার পরিমাণ লিখে রেফারেন্সে রুম নম্বর দিন।',
    ps_step_4: 'পিন দিয়ে কনফার্ম করুন।',
    ps_footer_notice: '* টাকা পাঠানোর পর বাড়িওয়ালাকে ট্রানজেকশন আইডি বা কনফার্মেশন মেসেজ পাঠান। *',
    ps_btn_copy_num: 'নম্বর কপি',
    ps_btn_copy_qr: 'QR ছবি কপি',
    ps_btn_save_qr: 'QR ছবি সেভ',
    ps_btn_whatsapp: 'WhatsApp-এ পাঠান',
    ps_btn_print_pdf: 'স্লিপ প্রিন্ট / PDF',
    ps_btn_print_receipt: 'প্রিন্ট / PDF সেভ করুন',

    // Tenant KYC Modal
    kyc_modal_title: 'ভাড়াটিয়া KYC ও ভেরিফিকেশন প্রোফাইল',
    kyc_tab_personal: 'ব্যক্তিগত তথ্য',
    kyc_tab_docs: 'NID ও ছবি',
    kyc_tab_lease: 'চুক্তি ও জরুরি যোগাযোগ',
    kyc_name: 'ভাড়াটিয়ার পূর্ণ নাম',
    kyc_phone: 'মোবাইল নম্বর',
    kyc_nid_no: 'জাতীয় পরিচয়পত্র / NID নং',
    kyc_occupation: 'পেশা / কর্মস্থল',
    kyc_members: 'পরিবারের মোট সদস্য সংখ্যা',
    kyc_father_name: 'পিতার নাম',
    kyc_perm_addr: 'স্থায়ী ঠিকানা',
    kyc_emergency_name: 'জরুরি যোগাযোগের ব্যক্তির নাম',
    kyc_emergency_rel: 'সম্পর্ক',
    kyc_emergency_phone: 'জরুরি ফোন নম্বর',
    kyc_advance_deposit: 'অগ্রিম জামানত (Security Deposit)',
    kyc_move_in_date: 'বাসায় ওঠার তারিখ',
    kyc_btn_save: 'ভাড়াটিয়া তথ্য সংরক্ষণ করুন',

    // Generic & Modals
    btn_save: 'সংরক্ষণ করুন',
    prop_room_count_lbl: 'মোট রুম / ফ্ল্যাটের সংখ্যা',
    prop_co_owners_chk: 'একাধিক মালিক (Co-Ownership)?',
    lbl_room_number: 'রুম নম্বর / পরিচিতি',
    receipt_banner_title: 'ভাড়া আদায়ের মানি রিসিট',
    receipt_banner_sub: 'House Rent Money Receipt & Utility Voucher',
    th_sl: 'ক্রম',
    th_particulars: 'বিবরণ (Particulars)',
    th_amount: 'পরিমাণ (BDT)',
    summary_modal_title: 'বাড়িওয়ালার মাসিক ভাড়া ও বকেয়া সামারি শীট',
    summary_doc_title: 'বাড়িওয়ালার মাসিক ভাড়া আদায় ও বকেয়া বিবরণী',
    summary_btn_copy_wa: 'হোয়াটসঅ্যাপ সামারি কপি',
    summary_btn_print: 'সামারি শিট প্রিন্ট / PDF',
    split_modal_title: 'মালিকদের মধ্যে আয়-ব্যয় বণ্টন',

    // Electricity Sub-metering
    elec_tab_title: 'বিদ্যুৎ সাব-মিটারিং',
    elec_submeter_name: 'সাব-মিটার নাম',
    elec_linked_room: 'লিঙ্ক করা রুম',
    elec_prev_reading: 'আগের রিডিং',
    elec_curr_reading: 'বর্তমান রিডিং',
    elec_units_used: 'ব্যবহার (Unit)',
    elec_add_submeter: '+ সাব-মিটার যুক্ত করুন',
    elec_rate_per_unit: 'প্রতি ইউনিটের রেট',
    elec_synced_badge: 'রুম ও বিলিং-এ স্বয়ংক্রিয়ভাবে সিঙ্ক হয়েছে',
    elec_no_meter: 'আগে একটি মেইন মিটার যুক্ত করুন।',

    // Toasts & Alerts
    toast_lang_changed: 'ভাষা পরিবর্তন করা হয়েছে: বাংলা',
    toast_saved_success: 'সফলভাবে সংরক্ষিত হয়েছে!',
    toast_qr_copied: '✓ QR ছবি ক্লিপবোর্ডে কপি হয়েছে! চ্যাটে Ctrl+V চেপে পেস্ট করুন।',
    toast_num_copied: 'নম্বর কপি হয়েছে!'
  },

  en: {
    // Topbar & Branding
    app_title: 'Property Manager',
    app_subtitle: 'Property Management System',
    theme_toggle_title: 'Toggle Theme (Light / Bluish)',
    lang_btn_text: 'বাংলা',
    lang_btn_title: 'বাংলায় পরিবর্তন করুন',
    demo_data: 'Sample Data',
    sync_btn: 'Sync Now',
    syncing_btn: 'Syncing...',
    auto_sync_active: 'Auto-sync Active',
    restore_btn: 'Restore',
    google_login: 'Google Login',
    logout_title: 'Logout',
    backup_demo_text: 'Demo mode — Data saved in LocalStorage. Connect Firebase for cloud sync.',

    // Login Page
    login_heading: 'Sign in with Google',
    login_subheading: 'Sign in with your verified Google account to access your landlord dashboard in one click.',
    login_btn_text: 'Sign in with Google',
    login_brand_desc: 'Smart rental accounting, electricity sub-metering, and tenant management.',
    login_secure_badge: 'Secure Dashboard Access',
    login_secure_notice: 'For the security and privacy of your properties and tenant data, signing in with Google is required.',
    feat_1: '<strong>Secure Google Sign-In</strong> — No passwords to remember.',
    feat_2: '<strong>Electric Sub-Meter Auto-Calculation</strong> — Precise unit billing for every room.',
    feat_3: '<strong>Comprehensive Tenant KYC</strong> — Family, NID documents and emergency contacts.',
    feat_4: '<strong>Digital Receipts & WhatsApp Sharing</strong> — 1-click money receipts and WhatsApp billing.',

    // Properties Page
    my_properties: 'My Properties',
    add_property_btn: 'Add New Property',
    no_properties_msg: 'No properties found. Add your first property.',
    rooms_suffix: 'Rooms',
    tenants_suffix: 'Tenants',
    due_badge: 'Due',
    confirm_delete_prop: 'Are you sure you want to delete this property?',
    property_modal_add: 'Add New Property',
    property_modal_edit: 'Edit Property',
    prop_name_lbl: 'Property Name',
    prop_addr_lbl: 'Address',
    prop_owners_lbl: 'Owners / Landlords (comma-separated)',
    prop_meter_no_lbl: 'Main Electric Meter No (Optional)',
    prop_save_btn: 'Save Property',

    // Property Detail Header & Navigator
    back_to_props: 'Back',
    print_summary_btn: 'Print Monthly Summary',
    owner_split_btn: 'Co-Owner Split',
    add_room_btn: 'Add Room',
    add_tenant_btn: 'Add New Tenant',
    auto_generate_btn: 'Auto-Generate Bills',
    tab_rooms: 'Rooms & Billing',
    tab_electricity: 'Electricity Meters',

    // Dashboard Metric Cards
    metric_total_rooms: 'Total Rooms',
    metric_paid_rooms: 'Paid Rooms',
    metric_due_rooms: 'Due Rooms',
    metric_due_amount: 'Total Due',
    metric_vacant_rooms: 'Vacant Rooms',
    metric_expected_rent: 'Expected Rent',

    // Rooms & Billing Table Headers
    th_room: 'Room',
    th_tenant: 'Tenant',
    th_phone: 'Phone Number',
    th_rent: 'Base Rent',
    th_electricity: 'Electricity',
    th_utilities: 'Utilities / Misc',
    th_total: 'Total Bill',
    th_status: 'Status',
    th_actions: 'Actions',

    // Status Badges
    status_paid: 'PAID',
    status_partial: 'PARTIAL',
    status_due: 'DUE',
    status_vacant: 'VACANT',
    status_advance: 'ADVANCE',

    // Action Tooltips & Buttons
    btn_bill: 'Bill',
    btn_edit_room: 'Edit Room',
    btn_kyc: 'KYC Profile',
    btn_receipt: 'Money Receipt',
    btn_slip: 'Payment Slip',
    no_tenant_assigned: 'No Tenant',
    click_to_assign: 'Assign Tenant',

    // Electricity Table Headers & Notices
    th_meter_no: 'Meter No',
    th_prev_reading: 'Prev Reading',
    th_curr_reading: 'Curr Reading',
    th_units: 'Units Used',
    th_rate: 'Rate / Unit (৳)',
    th_elec_cost: 'Electric Charge (৳)',
    elec_sync_notice: 'Sub-meter electric charges are automatically integrated into room bills.',

    // Bill Modal
    bill_modal_title: 'Monthly Bill & Payment Details',
    bill_room_title: 'Room No',
    bill_month_title: 'Month',
    lbl_base_rent: 'Base Rent',
    lbl_elec_charge: 'Electricity Bill (Sub-Meter)',
    lbl_water_charge: 'Water Charge',
    lbl_gas_charge: 'Gas Charge',
    lbl_wifi_charge: 'WiFi / Internet',
    lbl_other_charge: 'Other Service Charges',
    lbl_prev_balance: 'Previous Balance (Due/Advance)',
    lbl_total_bill: 'Total Bill',
    lbl_paid_amount: 'Paid Amount',
    lbl_paid_date: 'Payment Date',
    lbl_payment_gateway: 'Payment Gateway (Bangla QR)',
    lbl_remarks: 'Remarks / Notes',
    btn_save_bill: 'Save Bill',
    btn_delete_bill: 'Delete Bill',
    btn_close: 'Close',
    btn_cancel: 'Cancel',
    custom_qr_active: 'Custom Dynamic QR is active for this bill',
    custom_qr_upload_btn: 'Upload CellFin / bKash QR screenshot for this bill',
    custom_qr_clear_btn: 'Remove',

    // Money Receipt & Payment Slip
    receipt_title: 'House Rent Money Receipt',
    receipt_voucher_no: 'Voucher No:',
    receipt_date_txt: 'Date:',
    receipt_in_words: 'In Words:',
    receipt_notes_label: 'Remarks / Notes:',
    receipt_sig_tenant: "Tenant's Signature",
    receipt_sig_landlord: "Landlord / Manager's Signature",
    ps_title: 'Payment Slip & Bangla QR',
    ps_payable_amount: 'Payable Amount:',
    ps_acc_number: 'Account / Mobile No:',
    ps_acc_name: 'Account Holder Name:',
    ps_bank_name: 'Bank Name:',
    ps_payment_ref: 'Payment Reference:',
    ps_txn_type: 'Transaction Type:',
    ps_how_to_pay: 'How to pay?',
    ps_step_1: 'Open bKash, CellFin or Bank App and tap "Scan QR".',
    ps_step_2: 'Scan the Bangla QR code or send directly to the account number.',
    ps_step_3: 'Enter the amount and put Room number as reference.',
    ps_step_4: 'Confirm with your secret PIN.',
    ps_footer_notice: '* After payment, please share the transaction ID or confirmation with the landlord. *',
    ps_btn_copy_num: 'Copy Number',
    ps_btn_copy_qr: 'Copy QR Image',
    ps_btn_save_qr: 'Download QR',
    ps_btn_whatsapp: 'Send on WhatsApp',
    ps_btn_print_pdf: 'Print Slip / PDF',
    ps_btn_print_receipt: 'Print / Save PDF',

    // Tenant KYC Modal
    kyc_modal_title: 'Tenant KYC & Verification Profile',
    kyc_tab_personal: 'Personal Info',
    kyc_tab_docs: 'NID & Photos',
    kyc_tab_lease: 'Lease & Emergency Contact',
    kyc_name: 'Tenant Full Name',
    kyc_phone: 'Mobile Phone',
    kyc_nid_no: 'NID / Passport No',
    kyc_occupation: 'Occupation',
    kyc_members: 'Family Members Count',
    kyc_father_name: "Father's Name",
    kyc_perm_addr: 'Permanent Address',
    kyc_emergency_name: 'Emergency Contact Person',
    kyc_emergency_rel: 'Relationship',
    kyc_emergency_phone: 'Emergency Phone',
    kyc_advance_deposit: 'Security Deposit (Advance)',
    kyc_move_in_date: 'Move-in Date',
    kyc_btn_save: 'Save Tenant Info',

    // Generic & Modals
    btn_save: 'Save',
    prop_room_count_lbl: 'Total Rooms / Flats Count',
    prop_co_owners_chk: 'Multiple Co-Owners?',
    lbl_room_number: 'Room / Flat Number',
    receipt_banner_title: 'House Rent Money Receipt',
    receipt_banner_sub: 'House Rent Money Receipt & Utility Voucher',
    th_sl: 'Sl.',
    th_particulars: 'Particulars',
    th_amount: 'Amount (BDT)',
    summary_modal_title: 'Landlord Monthly Rent & Dues Summary Sheet',
    summary_doc_title: 'Landlord Monthly Rent Collection & Dues Statement',
    summary_btn_copy_wa: 'Copy Summary for WhatsApp',
    summary_btn_print: 'Print Summary Sheet / PDF',
    split_modal_title: 'Co-Owner Income & Expense Split',

    // Electricity Sub-metering
    elec_tab_title: 'Electricity Sub-Metering',
    elec_submeter_name: 'Sub-Meter Name',
    elec_linked_room: 'Linked Room',
    elec_prev_reading: 'Prev Reading',
    elec_curr_reading: 'Current Reading',
    elec_units_used: 'Usage (Unit)',
    elec_add_submeter: '+ Add Sub-Meter',
    elec_rate_per_unit: 'Rate per Unit',
    elec_synced_badge: 'Auto-synced to Rooms & Billing',
    elec_no_meter: 'Please add a Main Meter first.',

    // Toasts & Alerts
    toast_lang_changed: 'Language changed to: English',
    toast_saved_success: 'Saved successfully!',
    toast_qr_copied: '✓ QR image copied to clipboard! Press Ctrl+V in chat.',
    toast_num_copied: 'Number copied!'
  }
};

/* ── Active Language State ───────────────────────────────────── */
window.currentLang = (function() {
  try {
    return localStorage.getItem('pms_lang') || 'bn';
  } catch (_) {
    return 'bn';
  }
})();

/* ── Translation Accessor ───────────────────────────────────── */
window.t = function(key, fallback = '') {
  const lang = window.currentLang || 'bn';
  if (I18N[lang] && I18N[lang][key] !== undefined) {
    return I18N[lang][key];
  }
  if (I18N.bn && I18N.bn[key] !== undefined) {
    return I18N.bn[key];
  }
  return fallback || key;
};

/* ── Apply Translations to Entire DOM ────────────────────────── */
window.applyTranslations = function() {
  const lang = window.currentLang || 'bn';
  document.documentElement.setAttribute('lang', lang);

  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(node => {
    const key = node.getAttribute('data-i18n');
    const translated = window.t(key);
    if (translated) {
      if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
        node.placeholder = translated;
      } else {
        node.textContent = translated;
      }
    }
  });

  // Update elements with data-i18n-title
  document.querySelectorAll('[data-i18n-title]').forEach(node => {
    const key = node.getAttribute('data-i18n-title');
    const translated = window.t(key);
    if (translated) node.title = translated;
  });

  // Update elements with data-i18n-html (for nodes with nested tags/icons)
  document.querySelectorAll('[data-i18n-html]').forEach(node => {
    const key = node.getAttribute('data-i18n-html');
    const translated = window.t(key);
    if (translated) {
      const icon = node.querySelector('i, svg');
      if (icon) {
        node.innerHTML = '';
        node.appendChild(icon);
        node.append(' ' + translated);
      } else {
        node.innerHTML = translated;
      }
    }
  });

  // Update language toggle button label
  const btnText = document.getElementById('lang-toggle-text');
  if (btnText) {
    btnText.textContent = window.t('lang_btn_text');
  }
  const btnToggle = document.getElementById('btn-lang-toggle');
  if (btnToggle) {
    btnToggle.title = window.t('lang_btn_title');
  }
};

/* ── Switch Language ─────────────────────────────────────────── */
window.setLanguage = function(lang) {
  if (lang !== 'bn' && lang !== 'en') lang = 'bn';
  window.currentLang = lang;
  try {
    localStorage.setItem('pms_lang', lang);
  } catch (_) {}

  // 1. Translate static DOM
  window.applyTranslations();

  // 2. Re-render active views if loaded
  try {
    if (typeof renderPropertiesPage === 'function' && document.getElementById('page-properties')?.classList.contains('active')) {
      renderPropertiesPage();
    }
    if (typeof renderDetailPage === 'function' && document.getElementById('page-detail')?.classList.contains('active')) {
      renderDetailPage();
    }
    if (typeof renderElecTab === 'function' && document.getElementById('tab-electricity')?.classList.contains('active')) {
      renderElecTab();
    }
  } catch (e) {
    console.debug('Re-render after lang change:', e);
  }

  // 3. Inform user
  if (typeof toast === 'function') {
    toast(window.t('toast_lang_changed'), 'info', 2000);
  }
};

window.toggleLanguage = function() {
  const next = (window.currentLang === 'bn') ? 'en' : 'bn';
  window.setLanguage(next);
};

/* ── Auto-init on script execution ──────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  window.applyTranslations();
  const btn = document.getElementById('btn-lang-toggle');
  if (btn) {
    btn.onclick = window.toggleLanguage;
  }
});
