const catalog = JSON.parse(document.getElementById("catalog-data").textContent);
const treeEl = document.getElementById("tree");
const treeStageEl = treeEl.closest(".tree-stage");
const breadcrumbEl = document.getElementById("breadcrumb");
const panelEl = document.getElementById("coursePanel");
const searchInput = document.getElementById("searchInput");

const careerById = new Map(catalog.careers.map((career) => [career.id, career]));
const areaById = new Map(catalog.areas.map((area) => [area.id, area]));
const statusById = new Map(catalog.statuses.map((status) => [status.id, status]));
const courseById = new Map(catalog.courses.map((course) => [course.id, course]));
const publishedCourses = catalog.courses.filter((course) => course.materials.length > 0);

let state = { kind: "root" };

function getHorizontalChildLimit() {
  return window.matchMedia("(max-width: 767px)").matches ? 0 : 3;
}

function sortByName(items) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

function folderMetaForCourse(course) {
  if (course.variant) {
    return careerById.get(course.variant)?.shortName || course.variant;
  }

  if (course.status === "pending-confirmation") {
    return "por confirmar";
  }

  if (course.careers.length === 3) {
    return "3 carreras";
  }

  if (course.careers.length === 2) {
    return "2 carreras";
  }

  return careerById.get(course.careers[0])?.shortName || "";
}

function materialCount(course) {
  return course.materials.length;
}

function courseNode(course) {
  return {
    label: course.name,
    meta: folderMetaForCourse(course),
    count: materialCount(course),
    next: { kind: "course", courseId: course.id }
  };
}

function getCoursesForCareer(careerId) {
  return publishedCourses.filter((course) => course.careers.includes(careerId));
}

function getCoursesForArea(areaId) {
  return publishedCourses.filter((course) => course.areas.includes(areaId));
}

function getCareerSemesters(careerId) {
  const semesters = new Set();
  getCoursesForCareer(careerId).forEach((course) => {
    if (course.semesters[careerId]) {
      semesters.add(course.semesters[careerId]);
    }
  });
  return [...semesters].sort((a, b) => a - b);
}

function buildView(nextState) {
  if (nextState.kind === "root") {
    const careerCount = catalog.careers.filter((career) => getCoursesForCareer(career.id).length > 0).length;
    const areaCount = catalog.areas.filter((area) => getCoursesForArea(area.id).length > 0).length;

    return {
      root: "AYUDANTÍAS",
      breadcrumbs: [{ label: "AYUDANTÍAS", state: { kind: "root" } }],
      children: [
        { label: "CARRERAS", meta: `${careerCount} carreras`, next: { kind: "careers" } },
        { label: "ÁREAS", meta: `${areaCount} áreas`, next: { kind: "areas" } },
        { label: "CURSOS", meta: `${publishedCourses.length} cursos`, next: { kind: "courses" } }
      ]
    };
  }

  if (nextState.kind === "careers") {
    const careers = catalog.careers
      .map((career) => ({ ...career, count: getCoursesForCareer(career.id).length }))
      .filter((career) => career.count > 0);

    return {
      root: "CARRERAS",
      breadcrumbs: [
        { label: "AYUDANTÍAS", state: { kind: "root" } },
        { label: "CARRERAS", state: { kind: "careers" } }
      ],
      children: careers.map((career) => ({
        label: career.shortName,
        meta: `${career.count} cursos`,
        next: { kind: "career", careerId: career.id }
      })),
      empty: careers.length === 0 ? "Sin materiales publicados" : ""
    };
  }

  if (nextState.kind === "career") {
    const career = careerById.get(nextState.careerId);
    return {
      root: career.shortName,
      breadcrumbs: [
        { label: "AYUDANTÍAS", state: { kind: "root" } },
        { label: "CARRERAS", state: { kind: "careers" } },
        { label: career.shortName, state: nextState }
      ],
      children: getCareerSemesters(career.id).map((semester) => ({
        label: `SEMESTRE ${semester}`,
        meta: `${getCoursesForCareer(career.id).filter((course) => course.semesters[career.id] === semester).length} cursos`,
        next: { kind: "career-semester", careerId: career.id, semester }
      })),
      empty: getCareerSemesters(career.id).length === 0 ? "Sin materiales publicados" : ""
    };
  }

  if (nextState.kind === "career-semester") {
    const career = careerById.get(nextState.careerId);
    const courses = getCoursesForCareer(career.id).filter((course) => course.semesters[career.id] === nextState.semester);
    return {
      root: `SEMESTRE ${nextState.semester}`,
      breadcrumbs: [
        { label: "AYUDANTÍAS", state: { kind: "root" } },
        { label: "CARRERAS", state: { kind: "careers" } },
        { label: career.shortName, state: { kind: "career", careerId: career.id } },
        { label: `SEMESTRE ${nextState.semester}`, state: nextState }
      ],
      children: sortByName(courses).map(courseNode),
      empty: courses.length === 0 ? "Sin materiales publicados" : ""
    };
  }

  if (nextState.kind === "areas") {
    const areas = catalog.areas
      .map((area) => ({ ...area, count: getCoursesForArea(area.id).length }))
      .filter((area) => area.count > 0);
    return {
      root: "ÁREAS",
      breadcrumbs: [
        { label: "AYUDANTÍAS", state: { kind: "root" } },
        { label: "ÁREAS", state: { kind: "areas" } }
      ],
      children: sortByName(areas).map((area) => ({
        label: area.name,
        meta: `${area.count} cursos`,
        next: { kind: "area", areaId: area.id }
      })),
      empty: areas.length === 0 ? "Sin materiales publicados" : ""
    };
  }

  if (nextState.kind === "area") {
    const area = areaById.get(nextState.areaId);
    const courses = getCoursesForArea(area.id);
    return {
      root: area.name,
      breadcrumbs: [
        { label: "AYUDANTÍAS", state: { kind: "root" } },
        { label: "ÁREAS", state: { kind: "areas" } },
        { label: area.name, state: nextState }
      ],
      children: sortByName(courses).map(courseNode),
      empty: courses.length === 0 ? "Sin materiales publicados" : ""
    };
  }

  if (nextState.kind === "courses") {
    return {
      root: "CURSOS",
      breadcrumbs: [
        { label: "AYUDANTÍAS", state: { kind: "root" } },
        { label: "CURSOS", state: { kind: "courses" } }
      ],
      children: sortByName(publishedCourses).map(courseNode),
      empty: publishedCourses.length === 0 ? "Sin materiales publicados" : ""
    };
  }

  if (nextState.kind === "search") {
    const query = nextState.query.trim().toLocaleLowerCase("es");
    const courses = publishedCourses.filter((course) => {
      const haystack = [
        course.name,
        course.id,
        ...course.careers.map((id) => careerById.get(id)?.name || ""),
        ...course.areas.map((id) => areaById.get(id)?.name || "")
      ].join(" ").toLocaleLowerCase("es");
      return haystack.includes(query);
    });
    return {
      root: "BÚSQUEDA",
      breadcrumbs: [
        { label: "AYUDANTÍAS", state: { kind: "root" } },
        { label: "BÚSQUEDA", state: nextState }
      ],
      children: sortByName(courses).map(courseNode),
      empty: courses.length === 0 ? "Sin resultados" : ""
    };
  }

  if (nextState.kind === "course") {
    const course = courseById.get(nextState.courseId);
    return {
      root: course.name,
      rootMeta: folderMetaForCourse(course),
      breadcrumbs: [
        { label: "AYUDANTÍAS", state: { kind: "root" } },
        { label: course.name, state: nextState }
      ],
      children: []
    };
  }

  return buildView({ kind: "root" });
}

function setState(nextState) {
  state = nextState;
  render();
}

function renderBreadcrumbs(items) {
  breadcrumbEl.replaceChildren();
  items.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.label;
    button.addEventListener("click", () => {
      searchInput.value = "";
      setState(item.state);
    });
    breadcrumbEl.append(button);
    if (index < items.length - 1) {
      const separator = document.createElement("span");
      separator.textContent = "/";
      breadcrumbEl.append(separator);
    }
  });
}

function createFolder(label, meta, count, isRoot, onClick) {
  const folder = document.createElement("button");
  folder.type = "button";
  folder.className = isRoot ? "folder root-folder" : "folder clickable";
  folder.disabled = !onClick;
  if (onClick) {
    folder.addEventListener("click", onClick);
  }

  const name = document.createElement("span");
  name.className = "folder-name";
  name.textContent = label.toLocaleUpperCase("es");
  folder.append(name);

  if (meta) {
    const detail = document.createElement("span");
    detail.className = "folder-detail";
    detail.textContent = meta.toLocaleUpperCase("es");
    folder.append(detail);
  }

  if (Number.isInteger(count) && count > 0) {
    const badge = document.createElement("span");
    badge.className = "folder-count";
    badge.textContent = String(count);
    folder.append(badge);
  }

  return folder;
}

function createContentsItem(child) {
  const item = document.createElement("button");
  item.type = "button";
  item.className = "contents-item";
  item.addEventListener("click", () => setState(child.next));

  const icon = document.createElement("span");
  icon.className = "contents-folder-icon";
  item.append(icon);

  const text = document.createElement("span");
  text.className = "contents-text";

  const label = document.createElement("span");
  label.className = "contents-label";
  label.textContent = child.label;
  text.append(label);

  if (child.meta) {
    const meta = document.createElement("span");
    meta.className = "contents-meta";
    meta.textContent = child.meta;
    text.append(meta);
  }

  item.append(text);

  if (Number.isInteger(child.count) && child.count > 0) {
    const count = document.createElement("span");
    count.className = "contents-count";
    count.textContent = String(child.count);
    item.append(count);
  }

  return item;
}

function renderContentsPanel(children) {
  const panel = document.createElement("div");
  panel.className = "contents-panel";

  const heading = document.createElement("div");
  heading.className = "contents-heading";
  heading.textContent = `${children.length} elementos`;
  panel.append(heading);

  const list = document.createElement("div");
  list.className = "contents-list";
  children.forEach((child) => list.append(createContentsItem(child)));
  panel.append(list);

  treeEl.append(panel);
}

function renderTree(view) {
  treeEl.replaceChildren();
  treeStageEl.classList.toggle("compact", view.children.length === 0);
  const horizontalChildLimit = getHorizontalChildLimit();

  const outer = document.createElement("ul");
  const rootLi = document.createElement("li");
  const rootFolder = createFolder(view.root, view.rootMeta || "", null, true, null);
  rootLi.append(rootFolder);

  if (view.children.length > 0 && view.children.length <= horizontalChildLimit) {
    const childUl = document.createElement("ul");
    view.children.forEach((child) => {
      const li = document.createElement("li");
      const wrapper = document.createElement("div");
      wrapper.className = "folder-wrapper";
      wrapper.append(createFolder(child.label, child.meta, child.count, false, () => setState(child.next)));
      li.append(wrapper);
      childUl.append(li);
    });
    rootLi.append(childUl);
  }

  outer.append(rootLi);
  treeEl.append(outer);

  if (view.children.length > horizontalChildLimit) {
    renderContentsPanel(view.children);
  }

  if (view.empty) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = view.empty;
    treeEl.append(empty);
  }
}

function chip(text) {
  const el = document.createElement("span");
  el.className = "meta-chip";
  el.textContent = text;
  return el;
}

function renderCoursePanel(course) {
  panelEl.replaceChildren();

  if (!course) {
    panelEl.classList.remove("visible");
    return;
  }

  panelEl.classList.add("visible");

  const title = document.createElement("h2");
  title.textContent = course.name;
  panelEl.append(title);

  const meta = document.createElement("div");
  meta.className = "course-meta";
  course.careers.forEach((careerId) => meta.append(chip(careerById.get(careerId).shortName)));
  course.areas.forEach((areaId) => meta.append(chip(areaById.get(areaId).name)));
  meta.append(chip(statusById.get(course.status).name));
  panelEl.append(meta);

  const semesters = document.createElement("p");
  semesters.className = "course-semesters";
  semesters.textContent = Object.entries(course.semesters)
    .map(([careerId, semester]) => `${careerById.get(careerId).shortName}: semestre ${semester}`)
    .join(" · ");
  panelEl.append(semesters);

  if (course.relationId) {
    const relation = document.createElement("p");
    relation.className = "course-relation";
    relation.textContent = `grupo de comparación: ${course.relationId}`;
    panelEl.append(relation);
  }

  const materialsTitle = document.createElement("h3");
  materialsTitle.textContent = "Materiales";
  panelEl.append(materialsTitle);

  if (course.materials.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-materials";
    empty.textContent = "Sin materiales publicados.";
    panelEl.append(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "material-list";
  course.materials.forEach((material) => {
    const link = document.createElement("a");
    link.href = material.path;
    link.download = "";
    link.textContent = material.title;
    list.append(link);
  });
  panelEl.append(list);
}

function render() {
  const view = buildView(state);
  renderBreadcrumbs(view.breadcrumbs);
  renderTree(view);
  renderCoursePanel(state.kind === "course" ? courseById.get(state.courseId) : null);
}

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();
  if (query.length === 0) {
    setState({ kind: "root" });
    return;
  }
  setState({ kind: "search", query });
});

window.addEventListener("resize", () => render());

render();
