import type { NextConfig } from "next";
const config:NextConfig={transpilePackages:["@marketplace-engine/geography"],webpack(config){config.resolve.extensionAlias={".js":[".ts",".tsx",".js"],".jsx":[".tsx",".jsx"]};return config;}};
export default config;
