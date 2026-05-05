import type { Metadata } from "next";

import CsvProfitCalculatorClient from "./CsvProfitCalculatorClient";
import "./csvProfitCalculator.css";

export const metadata: Metadata = {
  title: "CSV Profit Calculator for Online Sellers | Simple Biz Toolkit",
  description:
    "Upload your seller CSV and create a simple monthly profit report. Processed locally in your browser.",
  alternates: {
    canonical: "https://www.simplebiztoolkit.com/tools/csv-profit-calculator",
  },
};

export default function CsvProfitCalculatorPage() {
  return <CsvProfitCalculatorClient />;
}
