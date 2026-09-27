import AssetImage from "../AssetImage/AssetImage.jsx";

export default function DinoImage({ alt = "", ...props }) {
  return <AssetImage {...props} alt={alt} />;
}
