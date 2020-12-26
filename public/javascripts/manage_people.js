var allUsers = null;
var allGroups = null;

function initialize(){
	$("table tbody>*").remove();
	$.ajax({
		method: "GET",
		url: "all-user",
		dataType: "json",
		data: {},
		success: function(data){

			allUsers = JSON.parse(data.users);
			allGroups = JSON.parse(data.groups);
			
			renderTable(allUsers, allGroups);

			allUsers.forEach((user) => {
				// Sử dụng hàm change để lưu giá trị trước khi thay đổi
				var selectTag = $(`#${user.id}`);
				$(selectTag).data("prev", $(selectTag).val());
				$(selectTag).change(()=>{
				$(selectTag).parent().siblings(".saveChange").children("button").attr("disabled", false);
				})
			})
		},
		error: function () {
			alert("This is an error occurring in getting data");
		}
	})
}

function renderTable(allUsers, allGroups){
	let tableContent = "";
	const colors = {
		"Khách" : "text-secondary",
		"Biên tập": "text-success",
		"Tác giả": "text-danger",
		"Phản biện": "text-warning",
		"Admin": "text-primary"
	}

	$("#people-table tr").remove();
	allUsers.sort(compareUserByGroupName);
	allUsers.forEach((user)=>{
		let id = user.id;
		let profile = user.profile;
		let groups = user.groups;
		let assignableGroups = user.assignableGroups;
		
		const roleHtmlCode = genRoleHtmlCode(id, groups, assignableGroups, colors);
		const rowCode = genRowCode(id, profile, roleHtmlCode, assignableGroups);
						
		tableContent += rowCode;                 
	});
	$("#people-table").html(tableContent);
	
	allUsers.forEach((user) => {
		// Sử dụng hàm change để lưu giá trị trước khi thay đổi
		var selectTag = $(`#${user.id}`);
		$(selectTag).data("prev", $(selectTag).val());
		$(selectTag).change(()=>{
		$(selectTag).parent().siblings(".saveChange").children("button").attr("disabled", false);
		})
	})
}

function changeGroup(userId){
	let selectTag = $(`#${userId}`);
	const fromGroupId = $(selectTag).data("prev");
	const toGroupId = $(selectTag).val();

	$.ajax({
	  method: "POST",
	  url: "change-group",
	  dataType: "json",
	  data: {userId: userId, fromGroupId: fromGroupId, toGroupId: toGroupId},
	  success: () =>{
		$(selectTag).parent().siblings(".saveChange").children("button").attr("disabled", true);
		allUsers = allUsers.map(user =>{
			if(user.id == userId)
			{
				user.groups.push(allGroups.filter(group => group.id == toGroupId)[0]);
			}
			return user;
		})
		renderTable(allUsers, allGroups);
	  },
	  error: () =>{
		alert("Can not change group for this account!");
	  } 
	})
}

function genRoleHtmlCode(id, groups, assignableGroups, colors)
{
	let roleHtmlCode = null;
	if(groups.length == 0){
		roleHtmlCode = `<select id="${id}">
						${assignableGroups.map(group => {return `<option value="${group.id}">${group.profile.name}</option>`})}
						</select>`;
		roleHtmlCode = roleHtmlCode.replace('value="#"', 'value="#" selected');
	}
	else if(groups.length == 1 && assignableGroups != null){
		roleHtmlCode = `<div class="row">
							<div class="col-sm-4"><a class="font-weight-bold d-inline ${colors[groups[0].profile.name]}">${groups[0].profile.name}</a></div>
							<div class="col-sm-8">
								<select id="${id}" hidden>
									${assignableGroups.map(group => {return `<option value="${group.id}">${group.profile.name}</option>`})}
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

function compareUserByGroupName(user1, user2){
	if(user1.groups.length ==0)
		return -1;
	else if(user2.groups.length == 0)
		return 1;
	else{
		if(user1.groups[0].profile.name == user2.groups[0].profile.name)
			return 0;
		else
			return user1.groups[0].profile.name > user2.groups[0].profile.name ? 1 : -1;
	}
}

$(document).on("ready", initialize());
