function initialize(){
    $("form input").prop("disabled", true);
}

function enableEdit(formId){
    $(`#${formId} input`).prop("disabled", false);
}

function enableSaveButton(formId){
    $(`#${formId} button`).prop("disabled", false);
}

function discardChange(formId){
    $(`#${formId} input`).prop("disabled", true);
}

function genGroupProfileHtmlCode(groupName, groupProfile){
    if(groupName=="Tác giả" || groupName=="Biên tập")
    {
        const alias = groupName=="Tác giả"? "author": "editor";
        return `<div class="card mt-2 mb-2">
                    <div class="card-header bg-secondary">
                        <h2 class="text-white d-inline">Hồ sơ cho ${groupName}}</h2>
                        <button class="d-inline float-right btn btn-info" onclick="enableEdit('${alias}-profile-form')">
                            <span><i class="fa fa-2x fa-edit"></i></span>
                        </button>
                    </div>
                    <div class="card-body">
                        <form class="w-100" action="/${alias}}/update-profile" method="post" id="${alias}-profile-form">
                            <div class="form-group w-100">
                                <label for="email">Email</label>
                                <input class="form-control" type="email" name="email" value="${groupProfile.email}}" />
                            </div>
                            <div class="d-flex justify-content-end">
                                <button class="btn btn-success mr-2" type="submit" disabled="disabled">Save</button>
                                <button class="btn btn-danger mr-2" disabled="disabled" onclick="discardChange('${alias}-profile-form')">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>`
    }
    else if(groupName=="Phản biện")
    {
        const alias = 'reviewer';
        return `<div class="card mt-2 mb-2">
                    <div class="card-header bg-secondary">
                        <h2 class="text-white d-inline">Hồ sơ cho ${groupName}}</h2>
                        <button class="d-inline float-right btn btn-info" onclick="enableEdit('${alias}-profile-form')">
                            <span><i class="fa fa-2x fa-edit"></i></span>
                        </button>
                    </div>
                    <div class="card-body">
                        <form class="w-100" action="/${alias}}/update-profile" method="post" id="${alias}-profile-form">
                            <div class="form-group w-100">
                                <label for="privateEmail">Email cá nhân</label>
                                <input class="form-control" type="email" name="privateEmail" value="${profile.privateEmail}}" /></div>
                            <div class="form-group w-100">
                                <label for="publicEmail">Email cơ quan</label>
                                <input class="form-control" type="email" name="publicEmail" value="${profile.publicEmail}" /></div>
                            <div class="form-group w-100">
                                <label for="level">Trình độ</label>
                                <input class="form-control" type="text" name="level" value="${profile.level}" /></div>
                            <div class="form-group w-100">
                                <label for="major">Chuyên môn</label>
                                <input class="form-control" type="text" name="major" value="${profile.major}" /></div>
                            <div class="form-group w-100">
                                <label for="workingDate">Ngày công tác</label>
                                <input class="form-control" type="datetime" name="workingDate" value="${profile.workingDate}" /></div>
                            <div class="d-flex justify-content-end">
                                <button class="btn btn-success mr-2" type="submit" disabled="disabled">Save</button>
                                <button class="btn btn-danger mr-2" disabled="disabled" onclick="discardChange('${alias}-profile-form')">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>`
    }
    return "";
}

$(document).on("load", initialize());
