import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dataPath = path.join(root, "src", "data");
const catalogPath = path.join(dataPath, "catalog");
const courseDataPath = path.join(dataPath, "courses");
const publicCoursesPath = path.join(root, "public", "files", "courses");
const errors = [];
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const periodPattern = /^\d{4}-(1|2|verano)$/;
const filenamePattern = /^(?<courseCode>[A-Z0-9]+(?:-[A-Z0-9]+)*)_(?<year>\d{4})_(?<semester>1|2|verano)_(?<courseName>[a-z0-9]+(?:-[a-z0-9]+)*)_(?<type>ayudantia|guia|control|prueba|examen|resumen|apunte|tarea|laboratorio|codigo|dataset)_(?<sequence>[1-9]\d?)(?:_(?<professor>[a-z]+(?:-[a-z]+)*\d*))?\.[a-z0-9]+$/;
const typeDirs = {
  ayudantia: "ayudantias",
  guia: "guias",
  control: "controles",
  prueba: "pruebas",
  examen: "examenes",
  resumen: "resumenes",
  apunte: "apuntes",
  tarea: "tareas",
  laboratorio: "laboratorios",
  codigo: "codigo",
  dataset: "datasets"
};

function fail(message) {
  errors.push(message);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assertArray(name, value) {
  if (!Array.isArray(value)) {
    fail(`${name} must be an array`);
    return [];
  }
  return value;
}

function assertUniqueIds(name, items) {
  const seen = new Set();
  items.forEach((item, index) => {
    if (!item.id) {
      fail(`${name}[${index}] is missing id`);
      return;
    }
    if (!idPattern.test(item.id)) {
      fail(`${name}.${item.id} has invalid id format`);
    }
    if (seen.has(item.id)) {
      fail(`${name}.${item.id} is duplicated`);
    }
    seen.add(item.id);
  });
  return seen;
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const output = [];
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      output.push(...walkFiles(fullPath));
      return;
    }
    output.push(fullPath);
  });
  return output;
}

function loadCourses() {
  if (!fs.existsSync(courseDataPath)) {
    fail("src/data/courses is missing");
    return [];
  }

  return fs
    .readdirSync(courseDataPath)
    .filter((file) => file.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((file) => {
      const course = readJson(path.join(courseDataPath, file));
      const expectedFile = `${course.id}.json`;

      if (file !== expectedFile) {
        fail(`src/data/courses/${file} must be named ${expectedFile}`);
      }

      return course;
    });
}

const catalog = {
  careers: readJson(path.join(catalogPath, "careers.json")),
  areas: readJson(path.join(catalogPath, "areas.json")),
  statuses: readJson(path.join(catalogPath, "statuses.json")),
  materialTypes: readJson(path.join(catalogPath, "material-types.json")),
  materialKinds: readJson(path.join(catalogPath, "material-kinds.json")),
  courses: loadCourses()
};

const careers = assertArray("careers", catalog.careers);
const areas = assertArray("areas", catalog.areas);
const statuses = assertArray("statuses", catalog.statuses);
const courses = assertArray("courses", catalog.courses);
const materialTypes = new Set(assertArray("materialTypes", catalog.materialTypes));
const materialKinds = new Set(assertArray("materialKinds", catalog.materialKinds));
const careerIds = assertUniqueIds("careers", careers);
const areaIds = assertUniqueIds("areas", areas);
const statusIds = assertUniqueIds("statuses", statuses);
const courseIds = assertUniqueIds("courses", courses);
const materialPaths = new Set();

courses.forEach((course) => {
  if (!course.name || typeof course.name !== "string") {
    fail(`courses.${course.id} is missing name`);
  }

  assertArray(`courses.${course.id}.careers`, course.careers).forEach((careerId) => {
    if (!careerIds.has(careerId)) {
      fail(`courses.${course.id} references unknown career ${careerId}`);
    }
    if (!course.semesters || !Number.isInteger(course.semesters[careerId])) {
      fail(`courses.${course.id} is missing semester for ${careerId}`);
    }
  });

  Object.keys(course.semesters || {}).forEach((careerId) => {
    if (!course.careers.includes(careerId)) {
      fail(`courses.${course.id} has semester for unlisted career ${careerId}`);
    }
  });

  assertArray(`courses.${course.id}.areas`, course.areas).forEach((areaId) => {
    if (!areaIds.has(areaId)) {
      fail(`courses.${course.id} references unknown area ${areaId}`);
    }
  });

  if (!statusIds.has(course.status)) {
    fail(`courses.${course.id} references unknown status ${course.status}`);
  }

  if (course.relationId && !idPattern.test(course.relationId)) {
    fail(`courses.${course.id} has invalid relationId`);
  }

  assertArray(`courses.${course.id}.materials`, course.materials).forEach((material, index) => {
    const label = `courses.${course.id}.materials[${index}]`;

    if (!material.id || !idPattern.test(material.id)) {
      fail(`${label} has invalid id`);
    }

    if (!material.title || typeof material.title !== "string") {
      fail(`${label} is missing title`);
    }

    if (!periodPattern.test(material.period || "")) {
      fail(`${label} has invalid period`);
    }

    if (!materialTypes.has(material.type)) {
      fail(`${label} has invalid type`);
    }

    if (!materialKinds.has(material.kind)) {
      fail(`${label} has invalid kind`);
    }

    if (!Number.isInteger(material.sequence) || material.sequence < 1 || material.sequence > 99) {
      fail(`${label} has invalid sequence`);
    }

    if (!Number.isInteger(material.version) || material.version < 1 || material.version > 99) {
      fail(`${label} has invalid version`);
    }

    if (!material.path || typeof material.path !== "string") {
      fail(`${label} is missing path`);
      return;
    }

    const expectedPrefix = `/files/courses/${course.id}/`;
    if (!material.path.startsWith(expectedPrefix)) {
      fail(`${label} path must start with ${expectedPrefix}`);
    }

    const parts = material.path.split("/").filter(Boolean);
    const period = parts[3];
    const typeDir = parts[4];
    const filename = parts[5];

    if (period !== material.period) {
      fail(`${label} path period must be ${material.period}`);
    }

    if (typeDir !== typeDirs[material.type]) {
      fail(`${label} path type directory must be ${typeDirs[material.type]}`);
    }

    const filenameMatch = (filename || "").match(filenamePattern);
    if (!filenameMatch) {
      fail(`${label} filename does not match the naming contract`);
    } else {
      const filenamePeriod = `${filenameMatch.groups.year}-${filenameMatch.groups.semester}`;
      const filenameSequence = Number(filenameMatch.groups.sequence);

      if (filenamePeriod !== material.period) {
        fail(`${label} filename period must be ${material.period}`);
      }

      if (filenameMatch.groups.type !== material.type) {
        fail(`${label} filename type must be ${material.type}`);
      }

      if (filenameSequence !== material.sequence) {
        fail(`${label} filename sequence must be ${material.sequence}`);
      }
    }

    const publicPath = path.join(root, "public", material.path);
    if (!fs.existsSync(publicPath)) {
      fail(`${label} points to missing file ${material.path}`);
    }

    if (materialPaths.has(material.path)) {
      fail(`${label} duplicates material path ${material.path}`);
    }
    materialPaths.add(material.path);
  });
});

walkFiles(publicCoursesPath).forEach((filePath) => {
  const relative = path.relative(path.join(root, "public"), filePath).split(path.sep).join("/");
  const publicPath = `/${relative}`;
  const filename = path.basename(filePath);
  const parts = publicPath.split("/").filter(Boolean);
  const courseId = parts[2];
  const period = parts[3];
  const typeDir = parts[4];
  const filenameMatch = filename.match(filenamePattern);

  if (!filenameMatch) {
    fail(`${publicPath} does not match the naming contract`);
  } else {
    const filenamePeriod = `${filenameMatch.groups.year}-${filenameMatch.groups.semester}`;

    if (filenamePeriod !== period) {
      fail(`${publicPath} filename period must match folder period ${period}`);
    }

    if (typeDir !== typeDirs[filenameMatch.groups.type]) {
      fail(`${publicPath} filename type must match folder ${typeDir}`);
    }
  }

  if (!materialPaths.has(publicPath)) {
    fail(`${publicPath} is not referenced in src/data/courses`);
  }

  if (!courseIds.has(courseId)) {
    fail(`${publicPath} uses unknown course folder ${courseId}`);
  }

  if (!periodPattern.test(period || "")) {
    fail(`${publicPath} has invalid period folder`);
  }

  if (!Object.values(typeDirs).includes(typeDir)) {
    fail(`${publicPath} has invalid material type folder`);
  }
});

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`catalog ok: ${courses.length} courses, ${materialPaths.size} materials`);
