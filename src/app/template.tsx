"use client"

import { motion } from "framer-motion"
import { pageTransition, pageTransitionConfig } from "@/lib/animations"

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={pageTransitionConfig}
    >
      {children}
    </motion.div>
  )
}
