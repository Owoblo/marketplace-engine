import type { NextConfig } from "next";
import path from "node:path";
const config:NextConfig={outputFileTracingRoot:path.join(__dirname,"../.."),serverExternalPackages:["@prisma/client",".prisma/client"],transpilePackages:["@marketplace-engine/geography"],webpack(config){config.resolve.extensionAlias={".js":[".ts",".tsx",".js"],".jsx":[".tsx",".jsx"]};return config;}};
export default config;
