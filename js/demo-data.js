/* ── Seed Demo Data ─────────────────────────────────────────── */
function seedDemoData(force = false) {
  if (!force && STATE.properties && STATE.properties.length > 0) return;

  const currentM = yyyymm(new Date());
  const propId = 'prop_green_view_1';

  const demoProp = {
    id: propId,
    name: 'গ্রীন ভিউ রেসিডেন্স (Green View)',
    address: 'বাড়ি ১২, রোড ৪/এ, ধানমন্ডি, ঢাকা',
    owners: ['০১৭XXXXXXXX (মালিক ১)', '০১৮YYYYYYYY (মালিক ২)'],
    rooms: [
      {
        id: 'r_101',
        propId: propId,
        number: '১০১ (১ম তলা)',
        baseRent: 16000,
        waterBill: 500,
        gasBill: 1080,
        wifiBill: 500,
        otherBill: 200,
        tenant: {
          name: 'মো: আরিফুল ইসলাম',
          phone: '01711000001',
          spouseName: 'ফারহানা আকতার',
          kidsCount: 1,
          kidsNames: 'তানভীর আহমেদ',
          permanentAddress: 'গ্রাম: রাধানগর, শ্রীমঙ্গল, মৌলভীবাজার',
          nidNumber: '19902692518000123',
          nidImage: '',
          emergencyName: 'আবুল কালাম',
          emergencyPhone: '01811000001',
          emergencyRelation: 'বড় ভাই',
          deposit: 32000,
          leaseStart: '2025-01-01'
        },
        bills: {
          [currentM]: {
            month: currentM,
            tenant: 'মো: আরিফুল ইসলাম',
            rent: 16000,
            electricity: 1450,
            water: 500,
            gas: 1080,
            wifi: 500,
            other: 200,
            total: 19730,
            paid: 19730,
            due: 0,
            paidDate: new Date().toISOString().split('T')[0],
            comment: 'বিকাশের মাধ্যমে পরিশোধিত'
          }
        }
      },
      {
        id: 'r_102',
        propId: propId,
        number: '১০২ (১ম তলা)',
        baseRent: 15000,
        waterBill: 500,
        gasBill: 1080,
        wifiBill: 500,
        otherBill: 0,
        tenant: {
          name: 'ড. শামীম আহমেদ',
          phone: '01812000002',
          spouseName: 'নুসরাত জাহান',
          kidsCount: 2,
          kidsNames: 'আয়ান, আরিশা',
          permanentAddress: 'থানা রোড, ফেনী সদর, ফেনী',
          nidNumber: '19852692518000456',
          nidImage: '',
          emergencyName: 'কাজী রফিকুল',
          emergencyPhone: '01912000002',
          emergencyRelation: 'মামা',
          deposit: 30000,
          leaseStart: '2024-06-01'
        },
        bills: {
          [currentM]: {
            month: currentM,
            tenant: 'ড. শামীম আহমেদ',
            rent: 15000,
            electricity: 1350,
            water: 500,
            gas: 1080,
            wifi: 500,
            other: 0,
            total: 18430,
            paid: 10000,
            due: 8430,
            paidDate: new Date().toISOString().split('T')[0],
            comment: '১০,০০০ নগদ দেওয়া হয়েছে, বাকি বিল আগামী সপ্তাহে'
          }
        }
      },
      {
        id: 'r_201',
        propId: propId,
        number: '২০১ (২য় তলা)',
        baseRent: 18000,
        waterBill: 500,
        gasBill: 1080,
        wifiBill: 500,
        otherBill: 300,
        tenant: {
          name: 'নাসরীন জাহান',
          phone: '01913000003',
          spouseName: 'ইকবাল মাহমুদ',
          kidsCount: 0,
          kidsNames: '',
          permanentAddress: 'হাউজিং এস্টেট, কুষ্টিয়া',
          nidNumber: '19952692518000789',
          nidImage: '',
          emergencyName: 'মাহমুদুল হক',
          emergencyPhone: '01713000003',
          emergencyRelation: 'বাবা',
          deposit: 36000,
          leaseStart: '2025-03-01'
        },
        bills: {
          [currentM]: {
            month: currentM,
            tenant: 'নাসরীন জাহান',
            rent: 18000,
            electricity: 2025,
            water: 500,
            gas: 1080,
            wifi: 500,
            other: 300,
            total: 22405,
            paid: 0,
            due: 22405,
            paidDate: '',
            comment: 'চলতি মাসের নোটিশ পাঠানো হয়েছে'
          }
        }
      },
      {
        id: 'r_202',
        propId: propId,
        number: '২০২ (২য় তলা)',
        baseRent: 17000,
        waterBill: 500,
        gasBill: 1080,
        wifiBill: 500,
        otherBill: 0,
        tenant: {
          name: 'ইঞ্জি: তানভীর হাসান',
          phone: '01614000004',
          spouseName: 'সামিয়া হক',
          kidsCount: 1,
          kidsNames: 'নিহাল',
          permanentAddress: 'মিরপুর ১০, ঢাকা',
          nidNumber: '19922692518000999',
          nidImage: '',
          emergencyName: 'হাসান হাবিব',
          emergencyPhone: '01514000004',
          emergencyRelation: 'চাচা',
          deposit: 34000,
          leaseStart: '2024-11-01'
        },
        bills: {
          [currentM]: {
            month: currentM,
            tenant: 'ইঞ্জি: তানভীর হাসান',
            rent: 17000,
            electricity: 1425,
            water: 500,
            gas: 1080,
            wifi: 500,
            other: 0,
            total: 20505,
            paid: 20505,
            due: 0,
            paidDate: new Date().toISOString().split('T')[0],
            comment: 'ব্যাংক ট্রান্সফারের মাধ্যমে পরিশোধ'
          }
        }
      },
      {
        id: 'r_301',
        propId: propId,
        number: '৩০১ (৩য় তলা - পেন্টহাউস)',
        baseRent: 20000,
        waterBill: 500,
        gasBill: 1080,
        wifiBill: 500,
        otherBill: 0,
        tenant: null,
        bills: {}
      }
    ]
  };

  const demoElec = {
    activeMeterIdx: 0,
    mainMeters: [
      {
        id: 'm_main_1',
        name: 'ডেসকো মেইন মিটার (গ্রীন ভিউ)',
        totalBill: 6250,
        subMeters: [
          { id: 'sm_1', name: 'সাব-মিটার ১০১', linkedRoomId: 'r_101', prevReading: 420, currReading: 536 },
          { id: 'sm_2', name: 'সাব-মিটার ১০২', linkedRoomId: 'r_102', prevReading: 310, currReading: 418 },
          { id: 'sm_3', name: 'সাব-মিটার ২০১', linkedRoomId: 'r_201', prevReading: 550, currReading: 712 },
          { id: 'sm_4', name: 'সাব-মিটার ২০২', linkedRoomId: 'r_202', prevReading: 280, currReading: 394 }
        ]
      }
    ]
  };

  if (!STATE.currentUser) {
    toast('নমুনা ডাটা লোড করার পূর্বে অনুগ্রহ করে লগইন করুন।', 'warn');
    return;
  }
  demoProp.ownerName = STATE.currentUser.displayName || STATE.currentUser.email || 'বাড়িওয়ালা';
  STATE.properties = [demoProp];
  save();
  try {
    localStorage.setItem('pms_elec_' + propId, JSON.stringify(demoElec));
  } catch (_) {}
}

el('btn-seed-demo')?.addEventListener('click', () => {
  if (!isLoggedIn()) {
    window.location.replace('login.html');
    return;
  }
  if (STATE.properties.length > 0 && !confirm('নমুনা ডেমো ডাটা লোড করতে চান?')) return;
  seedDemoData(true);
  renderPropertiesPage();
  toast('নমুনা ডাটা সফলভাবে লোড হয়েছে!', 'success');
});
