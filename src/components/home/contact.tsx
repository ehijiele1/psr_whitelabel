"use client"

export default function Contact() {
  return (
    <section className="bg-[#F9F8F3] dark:bg-[#1a1d24] pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] dark:text-white tracking-tight">
              Need help right now?
            </h2>
            <p className="mt-3 text-[#555555] dark:text-gray-400 max-w-md">
              Reach our team directly. Tenants can also message through the app once signed in.
            </p>
          </div>

          <div className="space-y-4">
            <a
              href="tel:+2348054164910"
              className="flex items-center justify-between bg-white dark:bg-[#2a2d35] rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow"
            >
              <div>
                <p className="text-[10px] font-semibold tracking-widest text-[#999999] dark:text-gray-500 uppercase mb-1">
                  Emergency
                </p>
                <p className="text-lg font-bold text-[#111111] dark:text-white">+234 805 416 4910</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#005A36]/10 dark:bg-[#00a85e]/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#005A36] dark:text-[#00a85e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </a>

            <a
              href="tel:+2348024427735"
              className="flex items-center justify-between bg-white dark:bg-[#2a2d35] rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow"
            >
              <div>
                <p className="text-[10px] font-semibold tracking-widest text-[#999999] dark:text-gray-500 uppercase mb-1">
                  Caretaker (Steve)
                </p>
                <p className="text-lg font-bold text-[#111111] dark:text-white">+234 802 442 7735</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#005A36]/10 dark:bg-[#00a85e]/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#005A36] dark:text-[#00a85e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
