import {describe,expect,it} from "vitest";
import {classifyFacebookGroupPost} from "../src/index.js";

describe("Facebook Group post classification",()=>{
  it("prioritizes direct moving requests",()=>{const result=classifyFacebookGroupPost({text:"Looking for movers in Windsor this Saturday. Any recommendations?",authorDisplayName:"Sarah Jones"});expect(result.opportunityType).toBe("direct_request");expect(result.score).toBeGreaterThanOrEqual(90);expect(result.suggestedDirectMessage).toContain("Hi Sarah")});
  it("routes service advertisements away from outreach",()=>{const result=classifyFacebookGroupPost({text:"We offer local moving services. Licensed and insured. Call or text for a free estimate."});expect(result.opportunityType).toBe("competitor");expect(result.recommendedAction).toBe("skip")});
  it("retains landlord referral opportunities",()=>{const result=classifyFacebookGroupPost({text:"Two-bedroom apartment for rent. Available for a new tenant next month."});expect(result.opportunityType).toBe("property_referral")});
  it("does not greet anonymous placeholders",()=>{const result=classifyFacebookGroupPost({text:"Need help moving a couch tomorrow",authorDisplayName:"Facebook User"});expect(result.suggestedDirectMessage).toMatch(/^Hi,/)});
});
