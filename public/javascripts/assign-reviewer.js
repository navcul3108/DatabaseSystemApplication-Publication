$(document).ready(()=>{
    $("#tempateDeadline").prop("min", getCurrentDate());
    $("#templateSelect").hide();
    $("#tempateDeadline").val(getCurrentDate());
    $(".deadline").each((_, inputTag)=>{
        if($(inputTag).val()==null){
            $(inputTag).val(getCurrentDate());
        }
        $(inputTag).prop("min", getCurrentDate());    
    })
})
function addReviewer(){
    if($("select").length==1){
        let newDiv = $(`<div class="form-group border border-success p-3">
                            <h5 class="font-weight-bold">Phản biện 1</h5>
                            <div class="mt-3 mb-3">
                                <h5 class="d-inline">Phân công</h5>
                                <div class="btn btn-warning d-inline float-right">Xóa</div>
                            </div>
                        </div>`);
        newDiv.append($("#templateSelect").clone().show());
        $(".select-block").append(newDiv);
    }
    else if($("select").length<4){
        let lastSelect = $("select").last();
        console.log(lastSelect);
        let selectTag = $(lastSelect).clone();
        $(selectTag).children("option").each((_, optionTag)=>{
            if($(optionTag).val()==$(lastSelect).val())
                $(optionTag).remove();
        })

        let newDiv = $(`<div class="form-group border border-success p-3">
                            <h5 class="font-weight-bold">Phản biện 1</h5>
                            <div class="mt-3 mb-3">
                                <h5 class="d-inline">Phân công</h5>
                                <div class="btn btn-sm btn-warning d-inline float-right" onclick="deleteReviewer(this)">Xóa</div>
                            </div>
                        </div>`);
        $(newDiv).append(selectTag);
        $(newDiv).append($('<h5 class="mt-3">Ngày gởi</h5>'));
        $(newDiv).append($("#tempateDeadline").clone().prop("hidden", false));
        $(".select-block").append(newDiv);
    }
}

function enableEdit(){
    $(".form-group select").prop("disabled", false);
    $("form button").prop("disabled", false);
    $("button.float-right").prop("disabled", false);
    $('.deadline').prop("disabled", false);
}

function deleteReviewer(deleteBtn){
    $(deleteBtn).closest(".form-group").remove();
}

function enableSubmit(){
    $("form button".prop("disabled", false));
}

function beforeSubmit(){
    let ssns = [];
    let isValid = true;
    console.log($('select:not(:disabled)'));
    $('select:not(:disabled)').each((_, selectTag)=>{
        if(ssn.length>0 && ssns.some(ssn == $(selectTag).val())){
            alert("Các tác giả ko được trùng tên nhau");
            isValid = false;
            return false;
        }
        ssns.push($(selectTag).val());
    })
    return isValid;
}

function getCurrentDate(){
    var now = new Date();

    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    var today = now.getFullYear()+"-"+(month)+"-"+(day) ;

    return today;
}