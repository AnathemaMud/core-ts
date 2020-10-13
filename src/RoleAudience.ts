import { ChannelAudience } from "./ChannelAudience";
import { Player } from "./Player";

export interface IRoleAudienceOptions {
  minRole: number;
}
export class RoleAudience extends ChannelAudience {
  minRole: number;
  constructor(options: IRoleAudienceOptions) {
    super(options);
    if (!options.hasOwnProperty("minRole")) {
      throw new Error("No role given for role audience");
    }
    this.minRole = options.minRole;
  }

  getBroadcastTargets() {
    return this.state.PlayerManager.filter(
      (player: Player) => player.role >= this.minRole && player !== this.sender
    );
  }
}
