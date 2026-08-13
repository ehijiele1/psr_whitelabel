"use client"

import { brand } from "@/lib/config"

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-[#0f172a] border-t border-gray-100 dark:border-gray-800 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#999999] dark:text-gray-500">
            &copy; {new Date().getFullYear()} {brand.name}
          </p>
          <p className="text-sm text-[#999999] dark:text-gray-500">
            {brand.supportEmail && (
              <a
                href={`mailto:${brand.supportEmail}`}
                className="text-[#005A36] dark:text-[#00a85e] hover:underline font-medium"
              >
                {brand.supportEmail}
              </a>
            )}
          </p>
        </div>
      </div>
    </footer>
  )
}
