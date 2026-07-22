import { Icon as OfflineIcon } from "@iconify/react/offline";
import accountCheckOutline from "@iconify-icons/mdi/account-check-outline";
import accountGroupOutline from "@iconify-icons/mdi/account-group-outline";
import accountOffOutline from "@iconify-icons/mdi/account-off-outline";
import alertOutline from "@iconify-icons/mdi/alert-outline";
import arrowLeft from "@iconify-icons/mdi/arrow-left";
import cancel from "@iconify-icons/mdi/cancel";
import check from "@iconify-icons/mdi/check";
import checkCircleOutline from "@iconify-icons/mdi/check-circle-outline";
import chevronDown from "@iconify-icons/mdi/chevron-down";
import chevronUp from "@iconify-icons/mdi/chevron-up";
import close from "@iconify-icons/mdi/close";
import closeCircleOutline from "@iconify-icons/mdi/close-circle-outline";
import cogOutline from "@iconify-icons/mdi/cog-outline";
import contentCopy from "@iconify-icons/mdi/content-copy";
import contentSaveOutline from "@iconify-icons/mdi/content-save-outline";
import controllerClassicOutline from "@iconify-icons/mdi/controller-classic-outline";
import eggOutline from "@iconify-icons/mdi/egg-outline";
import eyeOutline from "@iconify-icons/mdi/eye-outline";
import heartMinusOutline from "@iconify-icons/mdi/heart-minus-outline";
import heartPlusOutline from "@iconify-icons/mdi/heart-plus-outline";
import helpCircleOutline from "@iconify-icons/mdi/help-circle-outline";
import history from "@iconify-icons/mdi/history";
import loading from "@iconify-icons/mdi/loading";
import logout from "@iconify-icons/mdi/logout";
import magnify from "@iconify-icons/mdi/magnify";
import map from "@iconify-icons/mdi/map";
import mapMarkerRadiusOutline from "@iconify-icons/mdi/map-marker-radius-outline";
import monitorEye from "@iconify-icons/mdi/monitor-eye";
import paletteOutline from "@iconify-icons/mdi/palette-outline";
import pencilOutline from "@iconify-icons/mdi/pencil-outline";
import playCircleOutline from "@iconify-icons/mdi/play-circle-outline";
import plus from "@iconify-icons/mdi/plus";
import restore from "@iconify-icons/mdi/restore";
import shieldSword from "@iconify-icons/mdi/shield-sword";
import trashCanOutline from "@iconify-icons/mdi/trash-can-outline";
import trophyOutline from "@iconify-icons/mdi/trophy-outline";
import weatherNight from "@iconify-icons/mdi/weather-night";
import whiteBalanceSunny from "@iconify-icons/mdi/white-balance-sunny";

const iconMap = {
  "mdi:account-check-outline": accountCheckOutline,
  "mdi:account-group-outline": accountGroupOutline,
  "mdi:account-off-outline": accountOffOutline,
  "mdi:alert-outline": alertOutline,
  "mdi:arrow-left": arrowLeft,
  "mdi:cancel": cancel,
  "mdi:check": check,
  "mdi:check-circle-outline": checkCircleOutline,
  "mdi:chevron-down": chevronDown,
  "mdi:chevron-up": chevronUp,
  "mdi:close": close,
  "mdi:close-circle-outline": closeCircleOutline,
  "mdi:cog-outline": cogOutline,
  "mdi:content-copy": contentCopy,
  "mdi:content-save-outline": contentSaveOutline,
  "mdi:controller-classic-outline": controllerClassicOutline,
  "mdi:dinosaur": eggOutline,
  "mdi:egg-outline": eggOutline,
  "mdi:eye-outline": eyeOutline,
  "mdi:heart-minus-outline": heartMinusOutline,
  "mdi:heart-plus-outline": heartPlusOutline,
  "mdi:help-circle-outline": helpCircleOutline,
  "mdi:history": history,
  "mdi:loading": loading,
  "mdi:logout": logout,
  "mdi:magnify": magnify,
  "mdi:map": map,
  "mdi:map-marker-radius-outline": mapMarkerRadiusOutline,
  "mdi:monitor-cog": cogOutline,
  "mdi:monitor-eye": monitorEye,
  "mdi:palette-outline": paletteOutline,
  "mdi:pencil-outline": pencilOutline,
  "mdi:play-circle-outline": playCircleOutline,
  "mdi:plus": plus,
  "mdi:restore": restore,
  "mdi:shield-sword": shieldSword,
  "mdi:trash-can-outline": trashCanOutline,
  "mdi:trophy-outline": trophyOutline,
  "mdi:weather-night": weatherNight,
  "mdi:white-balance-sunny": whiteBalanceSunny,
};

export function Icon({ icon, ...props }) {
  const iconData = typeof icon === "string" ? iconMap[icon] : icon;

  if (!iconData) {
    if (import.meta.env.DEV) {
      console.warn(`Icono no mapeado: ${icon}`);
    }

    return null;
  }

  return <OfflineIcon icon={iconData} {...props} />;
}
