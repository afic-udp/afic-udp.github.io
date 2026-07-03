import careers from "./catalog/careers.json";
import areas from "./catalog/areas.json";
import statuses from "./catalog/statuses.json";
import materialTypes from "./catalog/material-types.json";
import materialKinds from "./catalog/material-kinds.json";

const courseModules = import.meta.glob("./courses/*.json", {
  eager: true,
  import: "default"
});

const courses = Object.values(courseModules).sort((a, b) => a.id.localeCompare(b.id, "es"));

export default {
  careers,
  areas,
  statuses,
  materialTypes,
  materialKinds,
  courses
};
