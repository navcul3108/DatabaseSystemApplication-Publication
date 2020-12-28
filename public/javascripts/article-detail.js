$(document).on("ready", ()=>{
})

function enableEdit(btn){
    console.log($(btn).parent().siblings(".card-body"));
    $(btn).parent().siblings(".card-body").find("select").prop("disabled", false);
}

function changeScore(selectTag){
    let tdTag = $(selectTag).parent().siblings(".score");
    $(tdTag).text($(selectTag).val());
    calcScore(selectTag);
}

function calcScore(selectTag){
    if(selectTag!=null){
        var total = 0, numTag = 0;
        $.each($(selectTag).parents("tbody").find(".score"), (_, tdTag)=>{
            numTag = numTag +1;
            total += parseInt($(tdTag).text());
        })
        console.log(total, numTag);
    
        if(numTag>0)
            total = Math.floor(total/numTag);
    
        $("#total-1").text(total.toString());
    }
    
}

$("#update-or-submit-btn").click(()=>{
    if($("#update-or-submit-btn").text()=="Thay doi"){
        $("#update-or-submit-btn").text("Cap nhat")
        $("#cancel-upate-state").prop("disabled", false);
        $("#state").prop("disabled", false)
    }
    else
        $("#update-or-submit-btn").prop("type", "submit");    

})

$("#cancel-upate-state").click(()=>{
    $("#update-or-submit-btn").text("Thay doi");
    $("#state").prop("disabled", true);
})