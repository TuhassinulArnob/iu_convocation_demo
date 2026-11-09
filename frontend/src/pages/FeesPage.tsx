import React, { useState, useEffect } from 'react';
import { Calculator, ShieldAlert, Check, HelpCircle } from 'lucide-react';
import { api } from '../services/api';
import { PageHero } from '../components/PageHero';

export const FeesPage: React.FC = () => {
  // Calculator state
  const [category, setCategory] = useState<'Regular' | 'Evening'>('Regular');
  const [degreeLevel, setDegreeLevel] = useState('Honours');
  const [certificateHeld, setCertificateHeld] = useState(false);
  const [totalGuests, setTotalGuests] = useState(0);
  const [underFiveCount, setUnderFiveCount] = useState(0);

  // Calculation result
  const [calcResult, setCalcResult] = useState<any>(null);

  useEffect(() => {
    // Generate guest objects for calculator
    const guests = [];
    const chargeable = Math.max(0, totalGuests - underFiveCount);
    for (let i = 0; i < chargeable; i++) {
      guests.push({ name: `Adult ${i + 1}`, age: 25, under_five: false });
    }
    for (let i = 0; i < underFiveCount; i++) {
      guests.push({ name: `Child ${i + 1}`, age: 3, under_five: true });
    }

    api.calculateFees({
      registration_category: category,
      primary_degree_level: degreeLevel,
      original_certificate_held: certificateHeld,
      guests,
    })
      .then(res => setCalcResult(res))
      .catch(err => console.error("Fee calc error:", err));
  }, [category, degreeLevel, certificateHeld, totalGuests, underFiveCount]);

  const handleTotalGuestsChange = (val: number) => {
    setTotalGuests(val);
    if (underFiveCount > val) {
      setUnderFiveCount(val);
    }
  };

  return (
    <div className="min-h-screen bg-iu-bg pb-20">
      
      {/* Top Hero matching Original IU Design */}
      <PageHero
        title="Fees"
        description="What registration costs and how to pay"
        eyebrow="5TH CONVOCATION 2027"
      />

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Official Reference Fee Table */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-iu-border shadow-sm overflow-hidden">
            <div className="bg-[#075C55] text-white px-6 py-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">FEE ITEM</span>
              <span className="text-xs font-bold uppercase tracking-wider">AMOUNT</span>
            </div>

            <div className="divide-y divide-stone-100 text-sm">
              {/* Item 1 */}
              <div className="p-5 flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-teal-dark">1. Registration fee</h4>
                  <p className="text-xs text-stone-500 mt-0.5">Regular or Evening, as your programme</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-stone-500">Regular: <strong className="text-teal-dark text-sm">৳ 4,500</strong></div>
                  <div className="text-xs text-stone-500 mt-0.5">Evening: <strong className="text-teal-dark text-sm">৳ 5,500</strong></div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="p-5 flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-teal-dark">2. Bachelor certificate</h4>
                  <p className="text-xs text-stone-500 mt-0.5">Not charged if you already have the original certificate</p>
                </div>
                <div className="font-bold text-teal-dark text-base shrink-0">
                  ৳ 500
                </div>
              </div>

              {/* Item 3 */}
              <div className="p-5 flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-teal-dark">3. Masters certificate</h4>
                  <p className="text-xs text-stone-500 mt-0.5">Not charged if you already have the original certificate</p>
                </div>
                <div className="font-bold text-teal-dark text-base shrink-0">
                  ৳ 700
                </div>
              </div>

              {/* Item 4 */}
              <div className="p-5 flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-teal-dark">4. M.Phil certificate</h4>
                  <p className="text-xs text-stone-500 mt-0.5">Not charged if you already have the original certificate</p>
                </div>
                <div className="font-bold text-teal-dark text-base shrink-0">
                  ৳ 1,500
                </div>
              </div>

              {/* Item 5 */}
              <div className="p-5 flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-teal-dark">5. PhD certificate</h4>
                  <p className="text-xs text-stone-500 mt-0.5">Not charged if you already have the original certificate</p>
                </div>
                <div className="font-bold text-teal-dark text-base shrink-0">
                  ৳ 2,000
                </div>
              </div>

              {/* Item 6 */}
              <div className="p-5 flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-teal-dark">6. Masters (Professional/Evening) certificate</h4>
                  <p className="text-xs text-stone-500 mt-0.5">Not charged if you already have the original certificate</p>
                </div>
                <div className="font-bold text-teal-dark text-base shrink-0">
                  ৳ 1,000
                </div>
              </div>

              {/* Item 7 */}
              <div className="p-5 flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-teal-dark">7. Guests (Parents / Spouse / Children)</h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Max 3 guests. <strong>Children under 5 years are exempt (free).</strong>
                  </p>
                </div>
                <div className="font-bold text-teal-dark text-base shrink-0">
                  ৳ 1,000 <span className="text-xs font-normal text-stone-500">/ guest</span>
                </div>
              </div>

              {/* Item 8 */}
              <div className="p-5 flex items-start justify-between gap-4 bg-stone-50/50">
                <div>
                  <h4 className="font-bold text-teal-dark">8. Online service charge</h4>
                  <p className="text-xs text-stone-500 mt-0.5">Standard online system processing fee per application</p>
                </div>
                <div className="font-bold text-teal-dark text-base shrink-0">
                  ৳ 32.50
                </div>
              </div>
            </div>

            {/* Payment Specific Disclaimer */}
            <div className="p-5 bg-amber-50 border-t border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>PAYMENT NOTICE:</strong> All payment steps on this site are simulations for UI/UX testing only. No actual transactions occur. Do not send money to any displayed QR code.
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Fee Calculator */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-iu-border shadow-md p-6">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-stone-100">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-deep flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-teal-dark text-base leading-tight">Live Fee Calculator</h3>
                <p className="text-xs text-stone-500">Calculate your total convocation cost</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Category */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Registration Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('Regular')}
                    className={`py-2 px-3 rounded-lg border font-semibold transition ${
                      category === 'Regular'
                        ? 'border-teal-deep bg-teal-50 text-teal-deep'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Regular (৳4,500)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('Evening')}
                    className={`py-2 px-3 rounded-lg border font-semibold transition ${
                      category === 'Evening'
                        ? 'border-teal-deep bg-teal-50 text-teal-deep'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Evening (৳5,500)
                  </button>
                </div>
              </div>

              {/* Degree Type */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">Degree Level</label>
                <select
                  value={degreeLevel}
                  onChange={(e) => setDegreeLevel(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-teal-deep"
                >
                  <option value="Honours">Undergraduate (Honours) — ৳500</option>
                  <option value="Masters">Postgraduate (Masters) — ৳700</option>
                  <option value="M.Phil">M.Phil — ৳1,500</option>
                  <option value="PhD">PhD — ৳2,000</option>
                  <option value="Masters (Professional/Evening)">Masters (Professional/Evening) — ৳1,000</option>
                </select>
              </div>

              {/* Certificate Held Toggle */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={certificateHeld}
                    onChange={(e) => setCertificateHeld(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-deep focus:ring-teal-deep border-stone-300"
                  />
                  <span className="font-semibold text-stone-700">
                    I already have my original degree certificate (Fee: ৳0)
                  </span>
                </label>
              </div>

              {/* Guests */}
              <div className="pt-2 border-t border-stone-100">
                <label className="font-bold text-stone-700 block mb-1">Total Guests (Max 3)</label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleTotalGuestsChange(num)}
                      className={`flex-1 py-1.5 rounded-lg border font-bold text-xs transition ${
                        totalGuests === num
                          ? 'bg-teal-deep text-white border-teal-deep'
                          : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Under 5 guests */}
              {totalGuests > 0 && (
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    How many guests are under 5 years old? (Free)
                  </label>
                  <select
                    value={underFiveCount}
                    onChange={(e) => setUnderFiveCount(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs"
                  >
                    {Array.from({ length: totalGuests + 1 }, (_, i) => (
                      <option key={i} value={i}>
                        {i} {i === 1 ? 'child' : 'children'} under 5
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Breakdown Preview */}
              {calcResult && (
                <div className="mt-5 p-4 rounded-xl bg-teal-50/60 border border-teal-200/70 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Base Registration:</span>
                    <span className="font-bold text-stone-800">৳ {calcResult.registration_fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Certificate Fee:</span>
                    <span className="font-bold text-stone-800">
                      {calcResult.certificate_fee > 0 ? `৳ ${calcResult.certificate_fee.toFixed(2)}` : '৳ 0.00 (Exempt)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Guest Fee ({calcResult.chargeable_guests} chargeable):</span>
                    <span className="font-bold text-stone-800">৳ {calcResult.guest_fee.toFixed(2)}</span>
                  </div>
                  {calcResult.exempt_guests > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Children Under 5:</span>
                      <span>{calcResult.exempt_guests} exempt (৳ 0)</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-600">
                    <span>Online Service Charge:</span>
                    <span className="font-bold text-stone-800">৳ {calcResult.service_charge.toFixed(2)}</span>
                  </div>

                  <div className="pt-3 border-t border-teal-200 flex justify-between items-center text-sm font-black text-teal-dark">
                    <span>Total Payable:</span>
                    <span className="text-xl text-teal-deep">{calcResult.formatted_total}</span>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
