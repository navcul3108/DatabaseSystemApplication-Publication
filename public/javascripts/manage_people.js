function genRoleHtmlCode(id, groups, assignableGroups, colors)
{
	let roleHtmlCode = null;
	if(groups.length == 0){
			roleHtmlCode = `<select id="${id}">
										${assignableGroups.map(group => {return `<option value="${group.id}">${group.groupName}</option>`})}
										</select>`;
			roleHtmlCode = roleHtmlCode.replace('value="#"', 'value="#" selected');
	}
	else if(groups.length == 1 && assignableGroups != null){
		roleHtmlCode = `<div class="row">
							<div class="col-sm-4"><a class="font-weight-bold d-inline ${colors[groups[0].profile.name]}">${groups[0].profile.name}</a></div>
							<div class="col-sm-8">
								<select id="${id}" hidden>
									${assignableGroups.map(group => {return `<option value="${group.id}">${group.groupName}</option>`})}
								</select>
								<a class="d-inline btn btn-primary btn-sm">Assign new role</a>
							</div>
						</div>`
	}
	else{
		roleHtmlCode = `${groups.map(group => `<a class="font-weight-bold ${colors[groups[0].profile.name]}">${group.profile.name}</a>`)}`;
	}
	return roleHtmlCode;
}

function genRowCode(id, profile, roleHtmlCode, assignableGroups){
	return ` <tr>
				<td>${id}</td>
				<td>${profile.firstName}</td>
				<td>${profile.lastName}</td>
				<td>${profile.email}</td>
				<td>${roleHtmlCode}</td>
				<td class="saveChange">
				${assignableGroups==null? "": `<button class="btn btn-primary btn-sm" onclick="changeGroup('${id}')" disabled>Save changes</button>`}
				</td>
			</tr>`
}