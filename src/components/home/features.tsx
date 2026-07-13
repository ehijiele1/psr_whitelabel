"use client"

export default function Features() {
  const cards = [
    {
      icon: (
        <svg className="w-6 h-6 text-[#005A36] dark:text-[#00a85e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      title: "Find your home",
      description: "Browse available apartments, shops, and stalls across our residential and commercial properties.",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-[#005A36] dark:text-[#00a85e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "Pay rent with ease",
      description: "Securely pay rent and utilities in Naira. Get instant PDF receipts for every transaction.",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-[#005A36] dark:text-[#00a85e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: "Stay connected",
      description: "Chat directly with your landlord, caretaker, and property manager. Receive important announcements in real time.",
    },
  ]

  return (
    <section className="bg-[#F9F8F3] dark:bg-[#1a1d24] py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] dark:text-white tracking-tight">
            Everything you need as a tenant
          </h2>
          <p className="mt-3 text-[#555555] dark:text-gray-400 max-w-xl mx-auto">
            From finding a unit to paying rent and staying in touch — we&apos;ve got you covered.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-white dark:bg-[#2a2d35] rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-[#005A36]/10 dark:bg-[#00a85e]/10 flex items-center justify-center mb-5">
                {card.icon}
              </div>
              <h3 className="text-lg font-bold text-[#111111] dark:text-white mb-2">{card.title}</h3>
              <p className="text-sm text-[#555555] dark:text-gray-400 leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
