from collections import deque, defaultdict

def build_graph(parent_child_edges, spouse_edges):
    graph = defaultdict(list)
    for parent_id, child_id in parent_child_edges:
        graph[parent_id].append((child_id, "down"))
        graph[child_id].append((parent_id, "up"))
    for p1, p2 in spouse_edges:
        graph[p1].append((p2, "spouse"))
        graph[p2].append((p1, "spouse"))
    return graph

def find_path(graph, start, end):
    if start == end:
        return [start], []
    queue = deque([(start, [start], [])])
    visited = {start}
    while queue:
        current, path, edges = queue.popleft()
        for neighbor, etype in graph[current]:
            if neighbor not in visited:
                new_path = path + [neighbor]
                new_edges = edges + [etype]
                if neighbor == end:
                    return new_path, new_edges
                visited.add(neighbor)
                queue.append((neighbor, new_path, new_edges))
    return None, None

def describe_relationship(path, edges, members):
    if not path or not edges:
        return None, None

    b = members.get(path[-1], {})
    b_gender = b.get("gender", "male")
    b_name = b.get("name", "")

    pattern = "".join("u" if e == "up" else "d" if e == "down" else "s" for e in edges)

    def _g(male_word, female_word):
        return male_word if b_gender == "male" else female_word

    label_map = {
        "d":    _g("ابنه", "ابنته"),
        "dd":   _g("حفيده", "حفيدته"),
        "ddd":  _g("ابن حفيده", "بنت حفيده"),
        "u":    _g("والده", "والدته"),
        "uu":   _g("جده", "جدته"),
        "uuu":  _g("جد الجد", "جدة الجد"),
        "ud":   _g("أخوه", "أخته"),
        "uud":  _g("عمه أو خاله", "عمته أو خالته"),
        "udd":  _g("ابن أخيه", "بنت أخيه"),
        "uudd": _g("ابن عمه أو ابن خاله", "بنت عمه أو بنت خاله"),
        "uuud": _g("ابن عم والده", "بنت عم والده"),
        "uddd": _g("ابن ابن أخيه", "بنت بنت أخيه"),
        "uuddd":_g("ابن ابن أخيه الكبير", "بنت ابن أخيه الكبير"),
        "uuudd":_g("ابن ابن عمه", "بنت ابن عمه"),
        "s":    _g("زوجه", "زوجته"),
        "sd":   _g("ربيبه", "ربيبته"),
        "us":   _g("صهره", "كنّته"),
    }

    summary = label_map.get(pattern)
    if not summary:
        up = pattern.count("u")
        down = pattern.count("d")
        sp = pattern.count("s")
        if sp == 0 and up > 0 and down > 0:
            if up == 1 and down == 1:
                summary = _g("أخوه غير الشقيق", "أخته غير الشقيقة")
            elif up == 1 and down == 2:
                summary = _g("ابن أخيه", "بنت أخيه")
            elif up == 2 and down == 1:
                summary = _g("عمه/خاله", "عمته/خالته")
            elif up == 2 and down == 2:
                summary = _g("ابن عمه/ابن خاله", "بنت عمه/بنت خاله")
            elif up == 2 and down == 3:
                summary = _g("ابن ابن عمه", "بنت ابن عمه")
            elif up == 3 and down == 2:
                summary = _g("ابن عم والده", "بنت عم والده")
            elif up == 3 and down == 3:
                summary = _g("ابن ابن عم والده", "بنت ابن عم والده")
            else:
                summary = f"قريبه من الدرجة (صعود {up}، نزول {down})"
        elif sp > 0:
            summary = "قريبه بالمصاهرة"
        
        if not summary:
            summary = "قريبه"

    # Find common ancestor
    # The common ancestor is the node where we switch from 'up' to 'down' (or if we only go 'up' or 'down', it's one of the ends).
    common_ancestor_idx = -1
    if "u" in pattern and "d" in pattern:
        # First 'down' edge comes right after the common ancestor
        common_ancestor_idx = pattern.index("d")
    elif "u" in pattern and "d" not in pattern:
        common_ancestor_idx = len(pattern) # the last node is the ancestor
    elif "d" in pattern and "u" not in pattern:
        common_ancestor_idx = 0 # the first node is the ancestor

    # Build step-by-step and edge labels for UI
    steps = []
    edge_labels = []
    for i, edge in enumerate(edges):
        from_name = members.get(path[i], {}).get("name", "...")
        to_m = members.get(path[i+1], {})
        to_name = to_m.get("name", "...")
        to_g = to_m.get("gender", "male")
        if edge == "up":
            rel = "والده" if to_g == "male" else "والدته"
            edge_labels.append("أب" if to_g == "male" else "أم")
        elif edge == "down":
            rel = "ابنه" if to_g == "male" else "ابنته"
            edge_labels.append("ابن" if to_g == "male" else "بنت")
        else:
            rel = "زوجه" if to_g == "male" else "زوجته"
            edge_labels.append("زوج" if to_g == "male" else "زوجة")
        steps.append(f"{from_name} ← {rel}: {to_name}")

    return summary, steps, common_ancestor_idx, edge_labels
