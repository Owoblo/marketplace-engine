import {describe,expect,it} from "vitest";
import {assessFacebookGroupRules,draftFacebookGroupAdminMessage} from "../src/index.js";

describe("Facebook group admin playbook",()=>{
  it("moves no-promotion groups to monitor only",()=>{
    const result=assessFacebookGroupRules("No advertising, business posts, solicitation, or spam.");
    expect(result.status).toBe("prohibited");
    expect(result.recommendedPolicy).toBe("MONITOR_ONLY");
  });

  it("recognizes admin approval requirements",()=>{
    const result=assessFacebookGroupRules("Business posts require admin approval. Contact a moderator first.");
    expect(result.status).toBe("permission_required");
    expect(result.adminApprovalRequired).toBe(true);
  });

  it("recognizes an approved promotion day",()=>{
    const result=assessFacebookGroupRules("Local business promotion is allowed in the Friday promotion thread.");
    expect(result.status).toBe("allowed");
    expect(result.commercialPostsAllowed).toBe(true);
  });

  it("drafts an Ottawa-specific permission request",()=>{
    const assessment=assessFacebookGroupRules("Ask an admin for permission before posting services.");
    const message=draftFacebookGroupAdminMessage({groupName:"Ottawa Neighbours",adminDisplayName:"Sarah Jones",regionName:"Ottawa",assessment});
    expect(message).toContain("Hi Sarah");
    expect(message).toContain("Dexa Movers");
    expect(message).toContain("Would that be acceptable");
  });
});
