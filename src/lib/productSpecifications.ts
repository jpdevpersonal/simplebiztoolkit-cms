import type { ProductFileFormat } from "@/types/product";

export interface ProductSpecificationSource {
  fileFormats?: ProductFileFormat[];
  printable?: boolean;
  fillable?: boolean;
  supportedApplications?: string[];
  paperSizes?: string[];
  licenseDescription?: string;
}

export interface ProductSpecification {
  name: string;
  value: string;
}

export function getProductSpecifications(
  product: ProductSpecificationSource,
): ProductSpecification[] {
  const specifications: ProductSpecification[] = [];

  if (product.fileFormats?.length) {
    specifications.push({
      name: "File format",
      value: product.fileFormats.join(", "),
    });
  }
  if (typeof product.printable === "boolean") {
    specifications.push({
      name: "Printable",
      value: product.printable ? "Yes" : "No",
    });
  }
  if (typeof product.fillable === "boolean") {
    specifications.push({
      name: "Fillable fields",
      value: product.fillable ? "Yes" : "No",
    });
  }
  if (product.supportedApplications?.length) {
    specifications.push({
      name: "Supported applications",
      value: product.supportedApplications.join(", "),
    });
  }
  if (product.paperSizes?.length) {
    specifications.push({
      name: "Paper sizes",
      value: product.paperSizes.join(", "),
    });
  }
  if (product.licenseDescription?.trim()) {
    specifications.push({
      name: "License",
      value: product.licenseDescription.trim(),
    });
  }

  return specifications;
}
