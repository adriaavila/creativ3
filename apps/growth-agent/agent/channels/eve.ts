import { eveChannel } from "eve/channels/eve";
import { httpBasic, localDev } from "eve/channels/auth";

const username = process.env.GROWTH_AGENT_USERNAME ?? "";
const password = process.env.GROWTH_AGENT_PASSWORD ?? "";

export default eveChannel({
  auth: [
    localDev(),
    ...(username && password ? [httpBasic({ username, password })] : []),
  ],
});
