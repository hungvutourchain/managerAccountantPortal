import { Route } from "@angular/router";

import { TariffUsersComponent } from "./tariff_users/tariff-users.component";
import { ImagesComponent } from "./SyncImages/SyncImages.component";
import { OutgoingMailboxComponent } from "./outgoing_mailbox/outgoing_mailbox.component";
import { AiTrainingComponent } from "./ai-training/ai-training.component";
import { OnlineUsersComponent } from "./OnlineUsersComponent/online-users.component";
import { AiPromptConfigComponent } from "./ai-prompt-config/ai-prompt-config.component";
import { AiManagementComponent } from "./ai-management/ai-management.component";
export const ConfigurationRoutes: Route[] = [
  {
    path: "online-users",
    component: OnlineUsersComponent,
  },
  {
    path: "tariff-users",
    component: TariffUsersComponent,
  },
  {
    path: "syn-images",
    component: ImagesComponent,
  },
  {
    path: "outgoing-mailbox",
    component: OutgoingMailboxComponent,
  },
  {
    path: "ai-train",
    component: AiTrainingComponent,
  },
  {
    path: "ai-prompt-config",
    component: AiPromptConfigComponent,
  },
  {
    path: "ai-management",
    component: AiManagementComponent,
  },
];
